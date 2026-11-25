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
      const [
        { data: associationDistributions },
        { data: farmerDistributions },
        { data: plantedDirectSeedlings },
        { data: allHarvests },
        { data: allMonitoringRecords }
      ] = await Promise.all([
        supabase
          .from('association_seedling_distributions')
          .select('quantity_distributed, date_distributed')
          .range(0, 9999),
        supabase
          .from('farmer_seedling_distributions')
          .select('quantity_distributed, planted_quantity, status, date_distributed, planting_date')
          .range(0, 9999),
        supabase
          .from('seedlings')
          .select('quantity_distributed, planted_quantity, planting_date')
          .eq('status', 'planted')
          .range(0, 9999),
        supabase
          .from('harvests')
          .select('area_hectares, dry_fiber_output_kg, harvest_date, status')
          .range(0, 9999),
        supabase
          .from('monitoring_records')
          .select('farmer_id, date_of_visit, farm_condition')
          .range(0, 9999)
      ]);

      const totalSeedlingsReceived = associationDistributions?.reduce(
        (sum, d) => sum + (d.quantity_distributed || 0), 0
      ) || 0;

      const totalSeedlingsDistributed = farmerDistributions?.reduce(
        (sum, d) => sum + (d.quantity_distributed || 0), 0
      ) || 0;

      const plantedFarmerSeedlings = (farmerDistributions || []).filter(d => d.status === 'planted');
      const totalSeedlingsPlanted =
        plantedFarmerSeedlings.reduce((sum, d) => sum + (d.planted_quantity ?? d.quantity_distributed ?? 0), 0) +
        (plantedDirectSeedlings?.reduce((sum, d) => sum + (d.planted_quantity ?? d.quantity_distributed ?? 0), 0) || 0);

      let totalAreaPlanted = 0;
      let totalHarvestFiber = 0;
      let actualHarvested = 0;
      const verifiedStatuses = new Set(['Verified', 'In Inventory', 'Delivered', 'Sold']);

      (allHarvests || []).forEach(h => {
        totalAreaPlanted += parseFloat(h.area_hectares) || 0;
        const fiber = parseFloat(h.dry_fiber_output_kg) || 0;
        totalHarvestFiber += fiber;
        if (verifiedStatuses.has(h.status)) {
          actualHarvested += fiber;
        }
      });

      const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const uniqueFarmerIds = new Set<string>();
      let recentMonitoringVisits = 0;

      (allMonitoringRecords || []).forEach(record => {
        if (record.farmer_id) uniqueFarmerIds.add(record.farmer_id);
        if (record.date_of_visit && record.date_of_visit >= thirtyDaysAgoStr) {
          recentMonitoringVisits++;
        }
      });

      res.status(200).json({
        totalSeedlingsReceived,
        totalSeedlingsDistributed,
        totalSeedlingsPlanted,
        totalAreaPlanted: Math.round(totalAreaPlanted * 100) / 100,
        totalHarvestFiber: Math.round(totalHarvestFiber * 100) / 100,
        actualHarvested: Math.round(actualHarvested * 100) / 100,
        totalMonitoringVisits: allMonitoringRecords?.length || 0,
        farmsMonitored: uniqueFarmerIds.size,
        recentMonitoringVisits,
        monthlyReceived: calculateMonthlySums(associationDistributions || [], 'date_distributed', 'quantity_distributed'),
        monthlyDistributed: calculateMonthlySums(farmerDistributions || [], 'date_distributed', 'quantity_distributed'),
        monthlyHarvest: calculateMonthlySums(allHarvests || [], 'harvest_date', 'dry_fiber_output_kg'),
        monthlyPlanted: calculateMonthlySums([
          ...plantedFarmerSeedlings,
          ...(plantedDirectSeedlings || [])
        ], 'planting_date', 'quantity_distributed')
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
      const [
        { data: allReports, error: salesError },
        { data: deliveries, error: deliveriesError }
      ] = await Promise.all([
        supabase
          .from('sales_reports')
          .select(`
            report_id,
            sale_date,
            buyer_company_name,
            quantity_sold,
            unit_price,
            total_amount,
            farmer_id,
            abaca_type,
            status
          `)
          .in('status', ['approved', 'pending'])
          .order('sale_date', { ascending: false }),
        supabase
          .from('fiber_deliveries')
          .select(`
            id,
            delivery_date,
            grade,
            quantity_kg,
            total_amount,
            farmer_id,
            status
          `)
          .eq('status', 'Completed')
      ]);

      if (salesError) throw salesError;
      if (deliveriesError) console.error('Error fetching deliveries for sales report:', deliveriesError);

      const salesReports = (allReports || []).filter(s => s.status === 'approved');
      const pendingSalesReports = (allReports || []).filter(s => s.status === 'pending');

      // Get farmer names for approved reports and completed deliveries
      const farmerIds = [...new Set([
        ...salesReports.map(s => s.farmer_id),
        ...(deliveries || []).map(d => d.farmer_id)
      ])].filter(Boolean);

      const { data: farmers } = farmerIds.length > 0
        ? await supabase
            .from('farmers')
            .select('farmer_id, full_name')
            .in('farmer_id', farmerIds)
        : { data: [] };

      const farmerMap = new Map((farmers || []).map(f => [f.farmer_id, f.full_name]));

      // Calculate approved totals (Reports + Completed Deliveries)
      const totalKgSoldFromReports = salesReports?.reduce(
        (sum, s) => sum + (parseFloat(s.quantity_sold) || 0), 0
      ) || 0;
      const totalKgSoldFromDeliveries = deliveries?.reduce(
        (sum, d) => sum + (parseFloat(d.quantity_kg) || 0), 0
      ) || 0;
      const totalKgSold = totalKgSoldFromReports + totalKgSoldFromDeliveries;

      const totalAmountFromReports = salesReports?.reduce(
        (sum, s) => sum + (parseFloat(s.total_amount) || 0), 0
      ) || 0;
      const totalAmountFromDeliveries = deliveries?.reduce(
        (sum, d) => sum + (parseFloat(d.total_amount) || 0), 0
      ) || 0;
      const totalAmount = totalAmountFromReports + totalAmountFromDeliveries;

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

      // Format all sales for processing
      const allSales = [
        ...(salesReports || []).map(sale => ({
          sale_date: sale.sale_date,
          farmer_name: farmerMap.get(sale.farmer_id) || 'Unknown',
          buyer_company_name: sale.buyer_company_name,
          quantity_sold: parseFloat(sale.quantity_sold),
          unit_price: parseFloat(sale.unit_price),
          total_amount: parseFloat(sale.total_amount),
          abaca_type: sale.abaca_type,
          source: 'report'
        })),
        ...(deliveries || []).map(d => ({
          sale_date: d.delivery_date,
          farmer_name: farmerMap.get(d.farmer_id) || 'Unknown Farmer',
          buyer_company_name: 'Association/Buyer',
          quantity_sold: parseFloat(d.quantity_kg),
          unit_price: d.quantity_kg > 0 ? d.total_amount / d.quantity_kg : 0,
          total_amount: parseFloat(d.total_amount),
          abaca_type: d.grade,
          source: 'delivery'
        }))
      ].sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());

      res.status(200).json({
        totalKgSold: Math.round(totalKgSold * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        pendingKgSold: Math.round(pendingKgSold * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        averagePricePerKg: Math.round(averagePricePerKg * 100) / 100,
        numberOfBuyers,
        recentSales: allSales.slice(0, 10),
        allSales
      });
    } catch (error) {
      console.error('Error fetching sales report:', error);
      res.status(500).json({ error: 'Failed to fetch sales report' });
    }
  }

  /**
   * GET /api/admin/sales-performance
   * Get sales performance analytics with fiber class breakdown
   */
  static async getSalesPerformanceReport(req: Request, res: Response) {
    try {
      const [
        { data: salesReports, error: salesError },
        { data: deliveries, error: deliveriesError }
      ] = await Promise.all([
        supabase
          .from('sales_reports')
          .select('report_id, sale_date, abaca_type, quantity_sold, total_amount, status')
          .eq('status', 'approved')
          .order('sale_date', { ascending: false }),
        supabase
          .from('fiber_deliveries')
          .select('id, delivery_date, grade, quantity_kg, total_amount, status')
          .eq('status', 'Completed')
          .order('delivery_date', { ascending: false })
      ]);

      if (salesError) throw salesError;
      if (deliveriesError) throw deliveriesError;

      // Combine both sources of sales data
      const unifiedSales = [
        ...(salesReports || []).map(r => ({
          date: r.sale_date,
          type: r.abaca_type,
          quantity: parseFloat(r.quantity_sold || 0),
          amount: parseFloat(r.total_amount || 0)
        })),
        ...(deliveries || []).map(d => ({
          date: d.delivery_date,
          type: d.grade,
          quantity: parseFloat(d.quantity_kg || 0),
          amount: parseFloat(d.total_amount || 0)
        }))
      ];

      const currentYear = new Date().getFullYear();

      // Initialize data structures for monthly and yearly tracking
      const monthlyStatsByYear: {
        [year: number]: {
          volumeA: number[], volumeB: number[], volumeC: number[],
          salesA: number[], salesB: number[], salesC: number[]
        }
      } = {};

      const yearlyStats: {
        [year: number]: {
          volumeA: number, volumeB: number, volumeC: number,
          salesA: number, salesB: number, salesC: number
        }
      } = {};

      // Process each unified sale record
      unifiedSales.forEach((sale: any) => {
        const date = new Date(sale.date);
        const year = date.getFullYear();
        const monthIndex = date.getMonth();
        const quantity = sale.quantity;
        const amount = sale.amount;
        const fiberClass = (sale.type || '').toLowerCase().trim();

        // Initialize year if not exists
        if (!monthlyStatsByYear[year]) {
          monthlyStatsByYear[year] = {
            volumeA: new Array(12).fill(0),
            volumeB: new Array(12).fill(0),
            volumeC: new Array(12).fill(0),
            salesA: new Array(12).fill(0),
            salesB: new Array(12).fill(0),
            salesC: new Array(12).fill(0)
          };
        }
        if (!yearlyStats[year]) {
          yearlyStats[year] = {
            volumeA: 0, volumeB: 0, volumeC: 0,
            salesA: 0, salesB: 0, salesC: 0
          };
        }

        // Categorize by fiber class - extremely robust matching
        // Matches: "A", "Class A", "Grade A", "Fiber A", "Class-A", "Grade 1", "Superior", etc.
        if (fiberClass.match(/\ba\b|class[-_\s]*a|grade[-_\s]*a|fiber[-_\s]*a|grade\s*1|superior/i)) {
          monthlyStatsByYear[year].volumeA[monthIndex] += quantity;
          monthlyStatsByYear[year].salesA[monthIndex] += amount;
          yearlyStats[year].volumeA += quantity;
          yearlyStats[year].salesA += amount;
        } else if (fiberClass.match(/\bb\b|class[-_\s]*b|grade[-_\s]*b|fiber[-_\s]*b|grade\s*2/i)) {
          monthlyStatsByYear[year].volumeB[monthIndex] += quantity;
          monthlyStatsByYear[year].salesB[monthIndex] += amount;
          yearlyStats[year].volumeB += quantity;
          yearlyStats[year].salesB += amount;
        } else if (fiberClass.match(/\bc\b|class[-_\s]*c|grade[-_\s]*c|fiber[-_\s]*c|grade\s*3/i)) {
          monthlyStatsByYear[year].volumeC[monthIndex] += quantity;
          monthlyStatsByYear[year].salesC[monthIndex] += amount;
          yearlyStats[year].volumeC += quantity;
          yearlyStats[year].salesC += amount;
        }
      });

      // Calculate totals
      const totalVolumeA = Object.values(yearlyStats).reduce((sum, y) => sum + y.volumeA, 0);
      const totalVolumeB = Object.values(yearlyStats).reduce((sum, y) => sum + y.volumeB, 0);
      const totalVolumeC = Object.values(yearlyStats).reduce((sum, y) => sum + y.volumeC, 0);
      const totalSalesA = Object.values(yearlyStats).reduce((sum, y) => sum + y.salesA, 0);
      const totalSalesB = Object.values(yearlyStats).reduce((sum, y) => sum + y.salesB, 0);
      const totalSalesC = Object.values(yearlyStats).reduce((sum, y) => sum + y.salesC, 0);

      res.status(200).json({
        totalVolumeA: Math.round(totalVolumeA * 100) / 100,
        totalVolumeB: Math.round(totalVolumeB * 100) / 100,
        totalVolumeC: Math.round(totalVolumeC * 100) / 100,
        totalSalesA: Math.round(totalSalesA * 100) / 100,
        totalSalesB: Math.round(totalSalesB * 100) / 100,
        totalSalesC: Math.round(totalSalesC * 100) / 100,
        totalVolume: Math.round((totalVolumeA + totalVolumeB + totalVolumeC) * 100) / 100,
        totalSales: Math.round((totalSalesA + totalSalesB + totalSalesC) * 100) / 100,
        monthlyStatsByYear,
        yearlyStats
      });
    } catch (error) {
      console.error('Error fetching sales performance report:', error);
      res.status(500).json({ error: 'Failed to fetch sales performance report' });
    }
  }

  /**
   * GET /api/admin/users-report
   * Get user statistics and recent registrations
   */
  static async getUsersReport(req: Request, res: Response) {
    try {
      const [
        { data: allFarmers, error: farmersError },
        { data: allBuyers, error: buyersError },
        { data: allCusafa, error: cusafaError },
        { data: allMao, error: maoError }
      ] = await Promise.all([
        supabase.from('farmers').select('full_name, email, created_at').order('created_at', { ascending: false }),
        supabase.from('buyers').select('owner_name, email, created_at').order('created_at', { ascending: false }),
        supabase.from('association_officers').select('full_name, email, created_at').order('created_at', { ascending: false }),
        supabase.from('organization').select('full_name, email, created_at').order('created_at', { ascending: false })
      ]);

      if (farmersError) console.error('❌ Supabase error (farmers):', farmersError);
      if (buyersError) console.error('❌ Supabase error (buyers):', buyersError);
      if (cusafaError) console.error('❌ Supabase error (cusafa):', cusafaError);
      if (maoError) console.error('❌ Supabase error (mao):', maoError);

      const farmersList = allFarmers || [];
      const buyersList = allBuyers || [];
      const cusafaList = allCusafa || [];
      const maoList = allMao || [];

      const monthlyTrends = calculateMonthlyTrends(
        farmersList,
        buyersList,
        cusafaList,
        maoList
      );

      const recentUsers = [
        ...farmersList.slice(0, 4).map((u: any) => ({ full_name: u.full_name, email: u.email, created_at: u.created_at, role: 'farmer' })),
        ...buyersList.slice(0, 3).map((u: any) => ({ full_name: u.owner_name, email: u.email, created_at: u.created_at, role: 'buyer' })),
        ...cusafaList.slice(0, 2).map((u: any) => ({ full_name: u.full_name, email: u.email, created_at: u.created_at, role: 'officer' })),
        ...maoList.slice(0, 1).map((u: any) => ({ full_name: u.full_name, email: u.email, created_at: u.created_at, role: 'admin' }))
      ]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      const farmersCount = farmersList.length;
      const buyersCount = buyersList.length;
      const cusafaCount = cusafaList.length;
      const maoCount = maoList.length;
      const totalUsers = farmersCount + buyersCount + cusafaCount + maoCount;

      res.status(200).json({
        totalUsers,
        totalFarmers: farmersCount,
        totalBuyers: buyersCount,
        totalCusafa: cusafaCount,
        totalMao: maoCount,
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
 * Helper function to calculate monthly registration trends for the last 24 months in O(N)
 */
function calculateMonthlyTrends(
  farmers: any[],
  buyers: any[],
  cusafa: any[],
  mao: any[]
) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const bucketMap = new Map<string, { farmers: number; buyers: number; cusafa: number; mao: number }>();

  const bump = (rows: any[], key: 'farmers' | 'buyers' | 'cusafa' | 'mao') => {
    for (const row of rows) {
      if (!row?.created_at) continue;
      const d = new Date(row.created_at);
      if (isNaN(d.getTime())) continue;
      const ym = `${d.getFullYear()}-${d.getMonth()}`;
      let entry = bucketMap.get(ym);
      if (!entry) {
        entry = { farmers: 0, buyers: 0, cusafa: 0, mao: 0 };
        bucketMap.set(ym, entry);
      }
      entry[key] += 1;
    }
  };

  bump(farmers, 'farmers');
  bump(buyers, 'buyers');
  bump(cusafa, 'cusafa');
  bump(mao, 'mao');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthlyData = [];

  for (let i = 23; i >= 0; i--) {
    const targetDate = new Date(currentYear, currentMonth - i, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const counts = bucketMap.get(`${targetYear}-${targetMonth}`) || {
      farmers: 0,
      buyers: 0,
      cusafa: 0,
      mao: 0,
    };

    monthlyData.push({
      month: months[targetMonth],
      year: targetYear,
      ...counts
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
