// BuyersController.ts - Buyers controller
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class BuyersController {
  // Get buyer profile with pricing
  static async getBuyerProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId || req.params.buyerId;
      
      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      // Get buyer info from buyers table
      const { data: buyer, error: buyerError } = await supabase
        .from('buyers')
        .select('*')
        .eq('buyer_id', userId)
        .single();

      if (buyerError || !buyer) {
        console.error('Buyer not found:', buyerError);
        res.status(404).json({ error: 'Buyer not found' });
        return;
      }

      // Get pricing information
      const { data: prices, error: pricesError } = await supabase
        .from('buyer_prices')
        .select('*')
        .eq('buyer_id', userId);

      res.status(200).json({ 
        buyer,
        prices: prices || []
      });
    } catch (error) {
      console.error('Error fetching buyer profile:', error);
      res.status(500).json({ error: 'Failed to fetch buyer profile' });
    }
  }

  // Update buyer profile and pricing
  static async updateBuyerProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { buyerInfo, prices } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      // Update buyer info in buyers table
      const { error: updateError } = await supabase
        .from('buyers')
        .update({
          business_name: buyerInfo.company_name || buyerInfo.business_name,
          owner_name: buyerInfo.contact_person || buyerInfo.owner_name,
          email: buyerInfo.email,
          contact_number: buyerInfo.phone || buyerInfo.contact_number,
          business_address: buyerInfo.address || buyerInfo.business_address,
          payment_terms: buyerInfo.payment_terms,
          profile_photo: buyerInfo.profile_picture || buyerInfo.profile_photo,
          updated_at: new Date().toISOString()
        })
        .eq('buyer_id', userId);

      if (updateError) throw updateError;

      // Delete existing prices
      await supabase
        .from('buyer_prices')
        .delete()
        .eq('buyer_id', userId);

      // Insert new prices
      if (prices && prices.length > 0) {
        const pricesWithBuyerId = prices.map((price: any) => ({
          buyer_id: userId,
          quality: price.quality,
          price_per_kg: price.price_per_kg,
          minimum_order: price.minimum_order,
          availability: price.availability
        }));

        const { error: pricesError } = await supabase
          .from('buyer_prices')
          .insert(pricesWithBuyerId);

        if (pricesError) throw pricesError;
      }

      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating buyer profile:', error);
      res.status(500).json({ error: 'Failed to update buyer profile' });
    }
  }

  // Get all buyers with pricing (for farmers/MAO/associations to view)
  static async getAllBuyers(req: Request, res: Response) {
    try {
      console.log('📞 getAllBuyers called by user:', req.user?.userId);
      console.log('🔍 Fetching buyers from database...');
      
      // First, try to get verified and active buyers
      let { data: buyers, error } = await supabase
        .from('buyers')
        .select('*')
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('business_name');

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log(`✅ Found ${buyers?.length || 0} verified & active buyers`);
      
      // If no verified buyers, get all active buyers (for development/testing)
      if (!buyers || buyers.length === 0) {
        console.log('⚠️ No verified buyers found, fetching all active buyers...');
        const result = await supabase
          .from('buyers')
          .select('*')
          .eq('is_active', true)
          .order('business_name');
        
        buyers = result.data;
        console.log(`📊 Found ${buyers?.length || 0} active buyers (not verified)`);
      }
      
      // If still no buyers, get ALL buyers
      if (!buyers || buyers.length === 0) {
        console.log('⚠️ No active buyers found, fetching ALL buyers...');
        const result = await supabase
          .from('buyers')
          .select('*')
          .order('business_name');
        
        buyers = result.data;
        console.log(`📊 Total buyers in database: ${buyers?.length || 0}`);
      }

      if (buyers && buyers.length > 0) {
        console.log('✅ First buyer:', {
          id: buyers[0].buyer_id,
          name: buyers[0].business_name,
          contact: buyers[0].contact_number,
          is_active: buyers[0].is_active,
          is_verified: buyers[0].is_verified
        });
      } else {
        console.log('❌ No buyers found in database at all!');
      }

      res.status(200).json({ 
        buyers: buyers || [],
        count: buyers?.length || 0,
        message: buyers?.length === 0 ? 'No buyers found in database' : 'Buyers loaded successfully'
      });
    } catch (error) {
      console.error('❌ Error fetching buyers:', error);
      res.status(500).json({ 
        error: 'Failed to fetch buyers',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get buyer transactions
  static async getBuyerTransactions(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      const { data: transactions, error } = await supabase
        .from('buyer_purchases')
        .select('*')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({ transactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch buyer transactions' });
    }
  }
}