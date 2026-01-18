import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Admin Reports Controller
 * Handles data-driven reports for admin dashboard
 */
export class AdminReportsController {
  /**
   * GET /api/admin/production-report
   * Get production statistics (seedlings, planting, harvest)
   */
  static async getProductionReport(req: Request, res: Response) {
    try {
      // 1. Total Seedlings Received (from association_seedling_distributions)
      const { data: associationDistributions, error: assocError } = await supabase
        .from('association_seedling_distributions')
        .select('quantity_distributed, date_distributed');

      const totalSeedlingsReceived = associationDistributions?.reduce(
        (sum, d) => sum + (d.quantity_distributed || 0), 0
      ) || 0;

      // 2. Total Seedlings Distributed to Farmers (from farmer_seedling_distributions)
      const { data: farmerDistributions, error: farmerError } = await supabase
        .from('farmer_seedling_distributions')
        .select('quantity_distributed, date_distributed');

      const totalSeedlingsDistributed = farmerDistributions?.reduce(
        (sum, d) => sum + (d.quantity_distributed || 0), 0
      ) || 0;

      // 3. Total Seedlings Planted (status = 'planted')
      const { data: plantedSeedlings, error: plantedError } = await supabase
        .from('farmer_seedling_distributions')
        .select('quantity_distributed')
        .eq('status', 'planted');

      const totalSeedlingsPlanted = plantedSeedlings?.reduce(
        (sum, d) => sum + (d.quantity_distributed || 0), 0
      ) || 0;

      // 4. Total Area Planted (from harvests)
      const { data: harvests, error: harvestsError } = await supabase
        .from('harvests')
        .select('area_hectares');

      const totalAreaPlanted = harvests?.reduce(
        (sum, h) => sum + (parseFloat(h.area_hectares) || 0), 0
      ) || 0;

      // 5. Total Harvest Fiber (ALL harvests regardless of status)
      const { data: allHarvests, error: allHarvestsError } = await supabase
        .from('harvests')
        .select('dry_fiber_output_kg, harvest_date');

      const totalHarvestFiber = allHarvests?.reduce(
        (sum, h) => sum + (parseFloat(h.dry_fiber_output_kg) || 0), 0
      ) || 0;

      // 6. Actual Harvested Fiber (from harvests with status 'Verified' or 'In Inventory')
      const { data: verifiedHarvests, error: verifiedError } = await supabase
        .from('harvests')
        .select('dry_fiber_output_kg')
        .in('status', ['Verified', 'In Inventory', 'Delivered', 'Sold']);

      const actualHarvested = verifiedHarvests?.reduce(
        (sum, h) => sum + (parseFloat(h.dry_fiber_output_kg) || 0), 0
      ) || 0;

      // 7. Field Monitoring Statistics
      const { count: totalMonitoringVisits } = await supabase
        .from('monitoring_records')
        .select('*', { count: 'exact', head: true });

      // Count farms monitored (unique farmer_ids)
      const { data: monitoredFarms } = await supabase
        .from('monitoring_records')
        .select('farmer_id');

      const uniqueFarmsMonitored = new Set(monitoredFarms?.map(m => m.farmer_id) || []).size;

      // Recent monitoring visits (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentMonitoringVisits } = await supabase
        .from('monitoring_records')
        .select('*', { count: 'exact', head: true })
        .gte('date_of_visit', thirtyDaysAgo.toISOString().split('T')[0]);

      // 8. Farm Condition Breakdown
      const { data: allMonitoringRecords } = await supabase
        .from('monitoring_records')
        .select('farm_condition');

      let healthyFarms = 0;
      let needsSupportFarms = 0;

      allMonitoringRecords?.forEach(record => {
        if (record.farm_condition === 'Healthy') {
          healthyFarms++;
        } else if (record.farm_condition === 'Needs Support' || record.farm_condition === 'Damaged') {
          needsSupportFarms++;
        }
      });

      res.status(200).json({
        totalSeedlingsReceived,
        totalSeedlingsDistributed,
        totalSeedlingsPlanted,
        totalAreaPlanted: Math.round(totalAreaPlanted * 100) / 100, // Round to 2 decimals
        totalHarvestFiber: Math.round(totalHarvestFiber * 100) / 100,
        actualHarvested: Math.round(actualHarvested * 100) / 100,
        totalMonitoringVisits: totalMonitoringVisits || 0,
        farmsMonitored: uniqueFarmsMonitored,
        recentMonitoringVisits: recentMonitoringVisits || 0,
        // Monthly breakdowns for charts
        monthlyReceived: calculateMonthlySums(associationDistributions || [], 'date_distributed', 'quantity_distributed'),
        monthlyDistributed: calculateMonthlySums(farmerDistributions || [], 'date_distributed', 'quantity_distributed'),
        monthlyHarvest: calculateMonthlySums(allHarvests || [], 'harvest_date', 'dry_fiber_output_kg')
      });
    } catch (error) {
      console.error('Error fetching production report:', error);
      res.status(500).json({ error: 'Failed to fetch production report' });
    }
  }

  /**
   * GET /api/admin/sales-report
   * Get sales statistics and recent transactions
   */
  static async getSalesReport(req: Request, res: Response) {
    try {
      // Get all approved sales reports with farmer info
      const { data: salesReports, error: salesError } = await supabase
        .from('sales_reports')
        .select(`
          report_id,
          sale_date,
          buyer_company_name,
          quantity_sold,
          unit_price,
          total_amount,
          farmer_id
        `)
        .eq('status', 'approved')
        .order('sale_date', { ascending: false });

      if (salesError) throw salesError;

      // Get pending sales reports
      const { data: pendingSalesReports, error: pendingError } = await supabase
        .from('sales_reports')
        .select(`
          report_id,
          sale_date,
          buyer_company_name,
          quantity_sold,
          unit_price,
          total_amount,
          farmer_id
        `)
        .eq('status', 'pending')
        .order('sale_date', { ascending: false });

      if (pendingError) throw pendingError;

      // Get farmer names separately
      const farmerIds = [...new Set((salesReports || []).map(s => s.farmer_id))];
      const { data: farmers } = await supabase
        .from('farmers')
        .select('farmer_id, full_name')
        .in('farmer_id', farmerIds);

      const farmerMap = new Map(farmers?.map(f => [f.farmer_id, f.full_name]) || []);

      // Calculate approved totals
      const totalKgSold = salesReports?.reduce(
        (sum, s) => sum + (parseFloat(s.quantity_sold) || 0), 0
      ) || 0;

      const totalAmount = salesReports?.reduce(
        (sum, s) => sum + (parseFloat(s.total_amount) || 0), 0
      ) || 0;

      // Calculate pending totals
      const pendingKgSold = pendingSalesReports?.reduce(
        (sum, s) => sum + (parseFloat(s.quantity_sold) || 0), 0
      ) || 0;

      const pendingAmount = pendingSalesReports?.reduce(
        (sum, s) => sum + (parseFloat(s.total_amount) || 0), 0
      ) || 0;

      // Calculate average price per kg
      const averagePricePerKg = totalKgSold > 0 ? totalAmount / totalKgSold : 0;

      // Count unique buyers
      const uniqueBuyers = new Set(salesReports?.map(s => s.buyer_company_name) || []);
      const numberOfBuyers = uniqueBuyers.size;

      // Format recent sales (last 10)
      const recentSales = (salesReports || []).slice(0, 10).map(sale => ({
        sale_date: sale.sale_date,
        farmer_name: farmerMap.get(sale.farmer_id) || 'Unknown',
        buyer_company_name: sale.buyer_company_name,
        quantity_sold: parseFloat(sale.quantity_sold),
        unit_price: parseFloat(sale.unit_price),
        total_amount: parseFloat(sale.total_amount)
      }));

      res.status(200).json({
        totalKgSold: Math.round(totalKgSold * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        pendingKgSold: Math.round(pendingKgSold * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        averagePricePerKg: Math.round(averagePricePerKg * 100) / 100,
        numberOfBuyers,
        recentSales
      });
    } catch (error) {
      console.error('Error fetching sales report:', error);
      res.status(500).json({ error: 'Failed to fetch sales report' });
    }
  }

  /**
   * GET /api/admin/users-report
   * Get user statistics and recent registrations
   */
  static async getUsersReport(req: Request, res: Response) {
    try {
      console.log('📊 AdminReportsController: Fetching User Statistics...');
      // 1. Count Farmers
      const { count: farmersCount, error: farmersError } = await supabase
        .from('farmers')
        .select('*', { count: 'exact', head: true });
      if (farmersError) console.error('❌ Supabase error (farmers):', farmersError);

      // 2. Count Buyers
      const { count: buyersCount, error: buyersError } = await supabase
        .from('buyers')
        .select('*', { count: 'exact', head: true });
      if (buyersError) console.error('❌ Supabase error (buyers):', buyersError);

      // 3. Count CUSAFA Officers (Association Officers)
      const { count: cusafaCount, error: cusafaError } = await supabase
        .from('association_officers')
        .select('*', { count: 'exact', head: true });
      if (cusafaError) console.error('❌ Supabase error (cusafa):', cusafaError);

      // 4. Count MAO Officers
      const { count: maoCount, error: maoError } = await supabase
        .from('organization')
        .select('*', { count: 'exact', head: true });
      if (maoError) console.error('❌ Supabase error (mao):', maoError);

      // 5. Get all users with created_at for monthly trends
      const { data: allFarmers } = await supabase
        .from('farmers')
        .select('created_at');

      const { data: allBuyers } = await supabase
        .from('buyers')
        .select('created_at');

      const { data: allCusafa } = await supabase
        .from('association_officers')
        .select('created_at');

      const { data: allMao } = await supabase
        .from('organization')
        .select('created_at');

      // 6. Calculate monthly registration trends
      const monthlyTrends = calculateMonthlyTrends(
        allFarmers || [],
        allBuyers || [],
        allCusafa || [],
        allMao || []
      );

      // 7. Get recent users (last 10 from all tables)
      const { data: recentFarmers } = await supabase
        .from('farmers')
        .select('full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(4);

      const { data: recentBuyers } = await supabase
        .from('buyers')
        .select('owner_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: recentOfficers } = await supabase
        .from('association_officers')
        .select('full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      const { data: recentAdmins } = await supabase
        .from('organization')
        .select('full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      // Combine and format recent users
      const recentUsers = [
        ...(recentFarmers || []).map((u: any) => ({ full_name: u.full_name, email: u.email, created_at: u.created_at, role: 'farmer' })),
        ...(recentBuyers || []).map((u: any) => ({ full_name: u.owner_name, email: u.email, created_at: u.created_at, role: 'buyer' })),
        ...(recentOfficers || []).map((u: any) => ({ full_name: u.full_name, email: u.email, created_at: u.created_at, role: 'officer' })),
        ...(recentAdmins || []).map((u: any) => ({ full_name: u.full_name, email: u.email, created_at: u.created_at, role: 'admin' }))
      ]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      // Calculate total users
      const totalUsers = (farmersCount || 0) + (buyersCount || 0) + (cusafaCount || 0) + (maoCount || 0);

      res.status(200).json({
        totalUsers,
        totalFarmers: farmersCount || 0,
        totalBuyers: buyersCount || 0,
        totalCusafa: cusafaCount || 0,
        totalMao: maoCount || 0,
        monthlyTrends,
        recentUsers
      });
    } catch (error) {
      console.error('Error fetching users report:', error);
      res.status(500).json({ error: 'Failed to fetch users report' });
    }
  }
}

/**
 * Helper function to calculate monthly registration trends for the last 24 months
 */
function calculateMonthlyTrends(
  farmers: any[],
  buyers: any[],
  cusafa: any[],
  mao: any[]
) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Create array for last 24 months (2 years)
  const monthlyData = [];
  for (let i = 23; i >= 0; i--) {
    const targetDate = new Date(currentYear, currentMonth - i, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const monthName = months[targetMonth];

    // Count registrations for this specific month
    const farmersCount = farmers.filter(f => {
      const date = new Date(f.created_at);
      return date.getFullYear() === targetYear && date.getMonth() === targetMonth;
    }).length;

    const buyersCount = buyers.filter(b => {
      const date = new Date(b.created_at);
      return date.getFullYear() === targetYear && date.getMonth() === targetMonth;
    }).length;

    const cusafaCount = cusafa.filter(c => {
      const date = new Date(c.created_at);
      return date.getFullYear() === targetYear && date.getMonth() === targetMonth;
    }).length;

    const maoCount = mao.filter(m => {
      const date = new Date(m.created_at);
      return date.getFullYear() === targetYear && date.getMonth() === targetMonth;
    }).length;

    monthlyData.push({
      month: monthName,
      year: targetYear,
      farmers: farmersCount,
      buyers: buyersCount,
      cusafa: cusafaCount,
      mao: maoCount
    });
  }

  return monthlyData;
}

/**
 * Helper function to calculate monthly sums for the current year
 */
function calculateMonthlySums(
  items: any[],
  dateField: string,
  valueField: string
) {
  const sums = new Array(12).fill(0);
  const currentYear = new Date().getFullYear();

  items.forEach(item => {
    if (!item[dateField]) return;
    const date = new Date(item[dateField]);
    const val = parseFloat(item[valueField]) || 0;

    if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
      sums[date.getMonth()] += val;
    }
  });

  return sums;
}
