import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class FiberDeliveriesController {
  // Create a new delivery
  static async createDelivery(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const deliveryData = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      // Calculate total amount
      const totalAmount = parseFloat(deliveryData.quantity_kg) * parseFloat(deliveryData.price_per_kg);

      const { data, error } = await supabase
        .from('fiber_deliveries')
        .insert({
          farmer_id: userId,
          buyer_id: deliveryData.buyer_id,
          harvest_id: deliveryData.harvest_id,
          delivery_date: deliveryData.delivery_date,
          delivery_time: deliveryData.delivery_time || null,
          variety: deliveryData.variety,
          quantity_kg: parseFloat(deliveryData.quantity_kg),
          grade: deliveryData.grade,
          municipality: deliveryData.municipality || null,
          barangay: deliveryData.barangay || null,
          price_per_kg: parseFloat(deliveryData.price_per_kg),
          total_amount: totalAmount,
          pickup_location: deliveryData.pickup_location,
          delivery_location: deliveryData.delivery_location,
          delivery_method: deliveryData.delivery_method,
          farmer_contact: deliveryData.farmer_contact,
          buyer_contact: deliveryData.buyer_contact,
          notes: deliveryData.notes || null,
          payment_method: deliveryData.payment_method || null,
          status: 'In Transit',
          payment_status: 'Unpaid'
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Delivery scheduled successfully',
        delivery: data
      });
    } catch (error) {
      console.error('Error creating delivery:', error);
      res.status(500).json({ error: 'Failed to create delivery' });
    }
  }

  // Get farmer's deliveries
  static async getFarmerDeliveries(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { status } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      let query = supabase
        .from('fiber_deliveries')
        .select(`
          *,
          buyers:buyer_id (
            business_name,
            contact_number,
            business_address
          )
        `)
        .eq('farmer_id', userId)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.status(200).json({ deliveries: data });
    } catch (error) {
      console.error('Error fetching farmer deliveries:', error);
      res.status(500).json({ error: 'Failed to fetch deliveries' });
    }
  }

  // Get buyer's deliveries
  static async getBuyerDeliveries(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { status } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      let query = supabase
        .from('fiber_deliveries')
        .select(`
          *,
          farmers:farmer_id (
            first_name,
            last_name,
            contact_number,
            barangay,
            municipality
          )
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.status(200).json({ deliveries: data });
    } catch (error) {
      console.error('Error fetching buyer deliveries:', error);
      res.status(500).json({ error: 'Failed to fetch deliveries' });
    }
  }

  // Update delivery status
  static async updateDeliveryStatus(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;
      const { status, notes } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) updateData.notes = notes;

      // Set timestamp based on status
      if (status === 'Confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (status === 'Delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'Completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'Cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        if (req.body.cancellation_reason) {
          updateData.cancellation_reason = req.body.cancellation_reason;
        }
      }

      const { data, error } = await supabase
        .from('fiber_deliveries')
        .update(updateData)
        .eq('delivery_id', deliveryId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: 'Delivery status updated successfully',
        delivery: data
      });
    } catch (error) {
      console.error('Error updating delivery status:', error);
      res.status(500).json({ error: 'Failed to update delivery status' });
    }
  }

  // Update payment status
  static async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;
      const { payment_status, payment_method, payment_date, receipt_image } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      const updateData: any = {
        payment_status,
        updated_at: new Date().toISOString()
      };

      if (payment_method) updateData.payment_method = payment_method;
      if (payment_date) updateData.payment_date = payment_date;
      if (receipt_image) updateData.receipt_image = receipt_image;

      const { data, error } = await supabase
        .from('fiber_deliveries')
        .update(updateData)
        .eq('delivery_id', deliveryId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: 'Payment status updated successfully',
        delivery: data
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ error: 'Failed to update payment status' });
    }
  }

  // Upload delivery proof
  static async uploadDeliveryProof(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;
      const { delivery_proof_image } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      const { data, error } = await supabase
        .from('fiber_deliveries')
        .update({
          delivery_proof_image,
          updated_at: new Date().toISOString()
        })
        .eq('delivery_id', deliveryId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: 'Delivery proof uploaded successfully',
        delivery: data
      });
    } catch (error) {
      console.error('Error uploading delivery proof:', error);
      res.status(500).json({ error: 'Failed to upload delivery proof' });
    }
  }

  // Get delivery details
  static async getDeliveryDetails(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      const { data, error } = await supabase
        .from('fiber_deliveries')
        .select(`
          *,
          farmers:farmer_id (
            first_name,
            last_name,
            contact_number,
            barangay,
            municipality
          ),
          buyers:buyer_id (
            business_name,
            contact_number,
            business_address
          )
        `)
        .eq('delivery_id', deliveryId)
        .single();

      if (error) throw error;

      res.status(200).json({ delivery: data });
    } catch (error) {
      console.error('Error fetching delivery details:', error);
      res.status(500).json({ error: 'Failed to fetch delivery details' });
    }
  }

  // Delete/Cancel delivery
  static async cancelDelivery(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;
      const { cancellation_reason } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      const { data, error } = await supabase
        .from('fiber_deliveries')
        .update({
          status: 'Cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancellation_reason || 'Cancelled by user',
          updated_at: new Date().toISOString()
        })
        .eq('delivery_id', deliveryId)
        .eq('farmer_id', userId) // Only farmer can cancel
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: 'Delivery cancelled successfully',
        delivery: data
      });
    } catch (error) {
      console.error('Error cancelling delivery:', error);
      res.status(500).json({ error: 'Failed to cancel delivery' });
    }
  }

  // Get delivery statistics (for farmer dashboard)
  static async getDeliveryStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      const { data, error } = await supabase
        .from('fiber_deliveries')
        .select('status, payment_status, total_amount, quantity_kg')
        .eq('farmer_id', userId);

      if (error) throw error;

      const stats = {
        total_deliveries: data.length,
        in_transit: data.filter(d => d.status === 'In Transit').length,
        delivered: data.filter(d => d.status === 'Delivered').length,
        completed: data.filter(d => d.status === 'Completed').length,
        cancelled: data.filter(d => d.status === 'Cancelled').length,
        total_quantity: data.reduce((sum, d) => sum + parseFloat(d.quantity_kg || 0), 0),
        total_revenue: data
          .filter(d => d.payment_status === 'Paid')
          .reduce((sum, d) => sum + parseFloat(d.total_amount || 0), 0),
        unpaid_amount: data
          .filter(d => d.payment_status === 'Unpaid')
          .reduce((sum, d) => sum + parseFloat(d.total_amount || 0), 0)
      };

      res.status(200).json({ stats });
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
      res.status(500).json({ error: 'Failed to fetch delivery statistics' });
    }
  }

  // Get all deliveries for CUSAFA
  static async getCUSAFADeliveries(req: Request, res: Response) {
    try {
      const { status } = req.query;

      let query = supabase
        .from('fiber_deliveries')
        .select(`
          *,
          farmers:farmer_id (
            first_name,
            last_name,
            contact_number,
            barangay,
            municipality
          ),
          buyers:buyer_id (
            business_name,
            contact_number,
            business_address
          )
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.status(200).json({ deliveries: data });
    } catch (error) {
      console.error('Error fetching CUSAFA deliveries:', error);
      res.status(500).json({ error: 'Failed to fetch deliveries' });
    }
  }

  // CUSAFA updates delivery status
  static async cusafaUpdateStatus(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;
      const { status, notes, delivery_proof_image } = req.body;

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) updateData.notes = notes;
      if (delivery_proof_image) updateData.delivery_proof_image = delivery_proof_image;

      // Set timestamp based on status
      if (status === 'Delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'Completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'Cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        if (req.body.cancellation_reason) {
          updateData.cancellation_reason = req.body.cancellation_reason;
        }
      }

      const { data, error } = await supabase
        .from('fiber_deliveries')
        .update(updateData)
        .eq('delivery_id', deliveryId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: 'Delivery status updated successfully',
        delivery: data
      });
    } catch (error) {
      console.error('Error updating delivery status:', error);
      res.status(500).json({ error: 'Failed to update delivery status' });
    }
  }
}
