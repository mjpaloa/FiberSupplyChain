import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class BuyerPurchasesController {
  /**
   * Create a new fiber purchase
   */
  static async createPurchase(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const {
        price,
        contactNumber,
        farmerName,
        fiberQuality,
        quantity,
        variety,
        totalPrice,
        imageUrl
      } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      const { data, error } = await supabase
        .from('buyer_purchases')
        .insert({
          buyer_id: userId,
          price: parseFloat(price),
          contact_number: contactNumber,
          farmer_name: farmerName,
          fiber_quality: fiberQuality,
          quantity: parseFloat(quantity),
          variety: variety,
          total_price: parseFloat(totalPrice),
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Purchase created successfully',
        purchase: data
      });
    } catch (error) {
      console.error('Error creating purchase:', error);
      res.status(500).json({ error: 'Failed to create purchase' });
    }
  }

  /**
   * Get all purchases for the authenticated buyer
   * Also calculates net inventory after deducting sales
   */
  static async getBuyerPurchases(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { quality, date_from, date_to } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      let query = supabase
        .from('buyer_purchases')
        .select('*')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (quality && quality !== 'all') {
        query = query.eq('fiber_quality', quality);
      }
      if (date_from) {
        query = query.gte('created_at', date_from);
      }
      if (date_to) {
        query = query.lte('created_at', date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch sales to calculate net inventory
      const { data: sales, error: salesError } = await supabase
        .from('buyer_sales')
        .select('fiber_class, quantity_kg')
        .eq('seller_id', userId);

      if (salesError) {
        console.warn('Error fetching sales (may not exist yet):', salesError);
      }

      // Calculate sold quantities per class
      const soldByClass: { [key: string]: number } = {};
      if (sales && Array.isArray(sales)) {
        sales.forEach((sale: any) => {
          const fiberClass = sale.fiber_class || 'Class C';
          soldByClass[fiberClass] = (soldByClass[fiberClass] || 0) + parseFloat(sale.quantity_kg || '0');
        });
      }

      res.status(200).json({
        purchases: data,
        sold_by_class: soldByClass
      });
    } catch (error) {
      console.error('Error fetching purchases:', error);
      res.status(500).json({ error: 'Failed to fetch purchases' });
    }
  }

  /**
   * Get analytics for buyer purchases
   */
  static async getAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { year, month } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      let query = supabase
        .from('buyer_purchases')
        .select('*')
        .eq('buyer_id', userId);

      if (year) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        query = query.gte('created_at', startDate).lte('created_at', endDate);
      }

      const { data: purchases, error } = await query;

      if (error) throw error;

      // Calculate analytics using total_price instead of price
      const totalSpent = purchases?.reduce((sum, p) => sum + parseFloat(p.total_price || '0'), 0) || 0;
      const totalPurchases = purchases?.length || 0;
      const totalQuantity = purchases?.reduce((sum, p) => sum + parseFloat(p.quantity || '0'), 0) || 0;

      // Monthly spending
      const monthlySpending = Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1;
        const monthPurchases = purchases?.filter(p => {
          const pDate = new Date(p.created_at);
          return pDate.getMonth() + 1 === monthNum;
        }) || [];
        const amount = monthPurchases.reduce((sum, p) => sum + parseFloat(p.total_price || '0'), 0);
        return {
          month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
          amount
        };
      });

      // Monthly comparison (current vs previous month)
      const monthlyComparison = Array.from({ length: 12 }, (_, i) => {
        const currentMonth = monthlySpending[i]?.amount || 0;
        const previousMonth = i > 0 ? (monthlySpending[i - 1]?.amount || 0) : 0;
        return {
          month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
          current: currentMonth,
          previous: previousMonth
        };
      });

      res.status(200).json({
        totalSpent,
        totalPurchases,
        totalQuantity,
        yearlyProfit: 0, // No profit tracking in new schema
        monthlySpending,
        recentTransactions: purchases?.slice(0, 5) || [],
        monthlyComparison
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  /**
   * Get transactions for buyer
   */
  static async getTransactions(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { search, sort } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      let query = supabase
        .from('buyer_purchases')
        .select('*')
        .eq('buyer_id', userId);

      // Apply sorting
      const sortField = (sort as string)?.split(':')[0] || 'created_at';
      const sortOrder = (sort as string)?.split(':')[1] === 'asc';
      query = query.order(sortField, { ascending: sortOrder });

      const { data, error } = await query;

      if (error) throw error;

      // Apply search filter in memory (for simplicity)
      let transactions = data || [];
      if (search) {
        const searchLower = (search as string).toLowerCase();
        transactions = transactions.filter(t =>
          t.fiber_quality?.toLowerCase().includes(searchLower) ||
          t.farmer_name?.toLowerCase().includes(searchLower) ||
          t.variety?.toLowerCase().includes(searchLower)
        );
      }

      res.status(200).json({ transactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }

  /**
   * Update purchase
   */
  static async updatePurchase(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { purchaseId } = req.params;
      const updateData = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('buyer_purchases')
        .select('buyer_id')
        .eq('purchase_id', purchaseId)
        .single();

      if (fetchError || !existing) {
        res.status(404).json({ error: 'Purchase not found' });
        return;
      }

      if (existing.buyer_id !== userId) {
        res.status(403).json({ error: 'Not authorized to update this purchase' });
        return;
      }

      const { data, error } = await supabase
        .from('buyer_purchases')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('purchase_id', purchaseId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: 'Purchase updated successfully',
        purchase: data
      });
    } catch (error) {
      console.error('Error updating purchase:', error);
      res.status(500).json({ error: 'Failed to update purchase' });
    }
  }

  /**
   * Delete purchase
   */
  static async deletePurchase(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { purchaseId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('buyer_purchases')
        .select('buyer_id')
        .eq('purchase_id', purchaseId)
        .single();

      if (fetchError || !existing) {
        res.status(404).json({ error: 'Purchase not found' });
        return;
      }

      if (existing.buyer_id !== userId) {
        res.status(403).json({ error: 'Not authorized to delete this purchase' });
        return;
      }

      const { error } = await supabase
        .from('buyer_purchases')
        .delete()
        .eq('purchase_id', purchaseId);

      if (error) throw error;

      res.status(200).json({ message: 'Purchase deleted successfully' });
    } catch (error) {
      console.error('Error deleting purchase:', error);
      res.status(500).json({ error: 'Failed to delete purchase' });
    }
  }

  /**
   * Get all sales for the authenticated buyer
   */
  static async getSales(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      const { data: sales, error } = await supabase
        .from('buyer_sales')
        .select('*')
        .eq('seller_id', userId)
        .order('sale_date', { ascending: false });

      if (error) throw error;

      res.status(200).json({ sales: sales || [] });
    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({ error: 'Failed to fetch sales' });
    }
  }

  /**
   * Record inventory sale - tracks when buyer sells fiber to customers
   */
  static async recordSale(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const {
        fiber_class,
        quantity_kg,
        price_per_kg,
        total_amount,
        buyer_name,
        notes
      } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      // Validate inputs
      if (!fiber_class || !quantity_kg || !price_per_kg || !buyer_name) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Check if buyer has enough inventory
      const { data: purchases, error: fetchError } = await supabase
        .from('buyer_purchases')
        .select('quantity, fiber_quality')
        .eq('buyer_id', userId)
        .eq('fiber_quality', fiber_class);

      if (fetchError) throw fetchError;

      const availableKg = purchases?.reduce((sum, p) => sum + parseFloat(p.quantity || '0'), 0) || 0;

      if (availableKg < quantity_kg) {
        res.status(400).json({
          error: 'Insufficient inventory',
          available: availableKg,
          requested: quantity_kg
        });
        return;
      }

      // Insert sale record
      const { data: sale, error: insertError } = await supabase
        .from('buyer_sales')
        .insert({
          seller_id: userId,
          fiber_class,
          quantity_kg: parseFloat(quantity_kg),
          price_per_kg: parseFloat(price_per_kg),
          total_amount: parseFloat(total_amount),
          buyer_name,
          notes,
          sale_date: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      res.status(201).json({
        message: 'Sale recorded successfully',
        sale,
        remaining_inventory: availableKg - quantity_kg
      });
    } catch (error) {
      console.error('Error recording sale:', error);
      res.status(500).json({ error: 'Failed to record sale' });
    }
  }

  /**
   * Delete sale record
   */
  static async deleteSale(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { saleId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('buyer_sales')
        .select('seller_id')
        .eq('sale_id', saleId)
        .single();

      if (fetchError || !existing) {
        res.status(404).json({ error: 'Sale record not found' });
        return;
      }

      if (existing.seller_id !== userId) {
        res.status(403).json({ error: 'Not authorized to delete this sale' });
        return;
      }

      const { error } = await supabase
        .from('buyer_sales')
        .delete()
        .eq('sale_id', saleId);

      if (error) throw error;

      res.status(200).json({ message: 'Sale record deleted successfully' });
    } catch (error) {
      console.error('Error deleting sale:', error);
      res.status(500).json({ error: 'Failed to delete sale' });
    }
  }
}
