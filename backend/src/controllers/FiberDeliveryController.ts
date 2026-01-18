// FiberDeliveryController.ts - Fiber Delivery Management
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class FiberDeliveryController {
  // Create new delivery
  static async createDelivery(req: Request, res: Response) {
    try {
      const farmerId = req.user?.userId;
      const {
        buyer_id, // Buyer UUID from the form
        fiber_inventory_id,
        delivery_date,
        delivery_time,
        delivery_method,
        delivery_location,
        farmer_contact,
        notes
      } = req.body;

      if (!farmerId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      // Validate required fields
      if (!buyer_id) {
        res.status(400).json({ error: 'Buyer is required' });
        return;
      }

      if (!fiber_inventory_id) {
        res.status(400).json({ error: 'Fiber inventory is required' });
        return;
      }

      // Get full inventory details from harvests table
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('harvests')
        .select('harvest_id, farmer_id, abaca_variety, dry_fiber_output_kg, fiber_grade, municipality, barangay')
        .eq('harvest_id', fiber_inventory_id)
        .eq('status', 'In Inventory')
        .single();

      if (inventoryError || !inventoryItem) {
        res.status(404).json({ error: 'Fiber inventory not found or already delivered' });
        return;
      }

      // Verify farmer owns this inventory (skip check for officers and association officers)
      const userType = req.user?.userType;
      if (userType === 'farmer' && inventoryItem.farmer_id !== farmerId) {
        res.status(403).json({ error: 'You can only create deliveries for your own fiber' });
        return;
      }

      // Find buyer by ID
      const { data: buyer, error: buyerError } = await supabase
        .from('buyers')
        .select('buyer_id, business_name, business_address, contact_number')
        .eq('buyer_id', buyer_id)
        .single();

      if (buyerError || !buyer) {
        res.status(404).json({ error: 'Buyer not found. Please select a valid buyer.' });
        return;
      }

      let buyerContact = buyer.contact_number || 'To be determined';

      // Create delivery with data from inventory
      const { data: delivery, error: deliveryError } = await supabase
        .from('fiber_deliveries')
        .insert({
          farmer_id: inventoryItem.farmer_id,
          buyer_id: buyer.buyer_id,
          harvest_id: inventoryItem.harvest_id,
          delivery_date,
          delivery_time,
          variety: inventoryItem.abaca_variety,
          quantity_kg: inventoryItem.dry_fiber_output_kg,
          grade: inventoryItem.fiber_grade,
          price_per_kg: 0, // Set to 0 since price is determined by buyer
          total_amount: 0, // Will be updated when buyer confirms
          pickup_location: `${inventoryItem.barangay}, ${inventoryItem.municipality}`,
          delivery_location: delivery_location || buyer.business_address || 'To be determined',
          delivery_method,
          farmer_contact,
          buyer_contact: buyerContact,
          payment_method: 'To be determined',
          notes: notes ? `${notes}\nBuyer: ${buyer.business_name}` : `Buyer: ${buyer.business_name}`,
          status: 'In Transit',
          payment_status: 'Unpaid'
        })
        .select()
        .single();

      if (deliveryError) {
        console.error('Error creating delivery:', deliveryError);
        res.status(500).json({ error: 'Failed to create delivery', details: deliveryError.message });
        return;
      }

      // Update harvest status to 'Delivered'
      const { error: updateError } = await supabase
        .from('harvests')
        .update({
          status: 'Delivered',
          updated_at: new Date().toISOString()
        })
        .eq('harvest_id', fiber_inventory_id);

      if (updateError) {
        console.error('Error updating inventory:', updateError);
        // Don't fail the delivery creation, just log the error
      }

      res.status(201).json({
        message: 'Delivery created successfully',
        delivery
      });
    } catch (error: any) {
      console.error('Error in createDelivery:', error);
      res.status(500).json({ error: 'Failed to create delivery', details: error.message });
    }
  }

  // Get farmer's deliveries
  static async getFarmerDeliveries(req: Request, res: Response) {
    try {
      const farmerId = req.user?.userId;
      const { status } = req.query;

      if (!farmerId) {
        res.status(401).json({ error: 'Farmer ID not found' });
        return;
      }

      let query = supabase
        .from('fiber_deliveries')
        .select(`
          *,
          buyers (
            business_name,
            contact_number,
            business_address
          ),
          farmers (
            full_name,
            contact_number,
            municipality,
            barangay
          )
        `)
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: deliveries, error } = await query;

      if (error) {
        console.error('Error fetching deliveries:', error);
        res.status(500).json({ error: 'Failed to fetch deliveries' });
        return;
      }

      res.status(200).json({ deliveries });
    } catch (error) {
      console.error('Error in getFarmerDeliveries:', error);
      res.status(500).json({ error: 'Failed to fetch deliveries' });
    }
  }

  // Get single delivery details
  static async getDeliveryById(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;
      const userId = req.user?.userId;

      const { data: delivery, error } = await supabase
        .from('fiber_deliveries')
        .select(`
          *,
          buyers (
            business_name,
            owner_name,
            contact_number,
            business_address,
            email
          ),
          farmers (
            full_name,
            contact_number,
            municipality,
            barangay
          )
        `)
        .eq('delivery_id', deliveryId)
        .single();

      if (error || !delivery) {
        res.status(404).json({ error: 'Delivery not found' });
        return;
      }

      // Check if user has access to this delivery
      if (delivery.farmer_id !== userId && delivery.buyer_id !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.status(200).json({ delivery });
    } catch (error) {
      console.error('Error in getDeliveryById:', error);
      res.status(500).json({ error: 'Failed to fetch delivery details' });
    }
  }

  // Update delivery
  static async updateDelivery(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;
      const farmerId = req.user?.userId;
      const updateData = req.body;

      // Check if delivery exists and belongs to farmer
      const { data: existingDelivery, error: checkError } = await supabase
        .from('fiber_deliveries')
        .select('*')
        .eq('delivery_id', deliveryId)
        .eq('farmer_id', farmerId)
        .single();

      if (checkError || !existingDelivery) {
        res.status(404).json({ error: 'Delivery not found or access denied' });
        return;
      }

      // Only allow updates if status is 'In Transit' or 'Confirmed'
      if (existingDelivery.status !== 'In Transit' && existingDelivery.status !== 'Confirmed') {
        res.status(400).json({ error: 'Cannot update delivery after it has been delivered' });
        return;
      }

      // Recalculate total if quantity or price changed
      if (updateData.quantity_kg || updateData.price_per_kg) {
        const quantity = updateData.quantity_kg || existingDelivery.quantity_kg;
        const price = updateData.price_per_kg || existingDelivery.price_per_kg;
        updateData.total_amount = parseFloat(quantity) * parseFloat(price);
      }

      updateData.updated_at = new Date().toISOString();

      const { data: updatedDelivery, error: updateError } = await supabase
        .from('fiber_deliveries')
        .update(updateData)
        .eq('delivery_id', deliveryId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating delivery:', updateError);
        res.status(500).json({ error: 'Failed to update delivery' });
        return;
      }

      res.status(200).json({
        message: 'Delivery updated successfully',
        delivery: updatedDelivery
      });
    } catch (error) {
      console.error('Error in updateDelivery:', error);
      res.status(500).json({ error: 'Failed to update delivery' });
    }
  }

  // Delete delivery (only if In Transit)
  static async deleteDelivery(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;
      const farmerId = req.user?.userId;

      // Check if delivery exists and belongs to farmer
      const { data: existingDelivery, error: checkError } = await supabase
        .from('fiber_deliveries')
        .select('status')
        .eq('delivery_id', deliveryId)
        .eq('farmer_id', farmerId)
        .single();

      if (checkError || !existingDelivery) {
        res.status(404).json({ error: 'Delivery not found or access denied' });
        return;
      }

      // Only allow deletion if status is 'In Transit'
      if (existingDelivery.status !== 'In Transit') {
        res.status(400).json({ error: 'Cannot delete delivery after it has been processed' });
        return;
      }

      const { error: deleteError } = await supabase
        .from('fiber_deliveries')
        .delete()
        .eq('delivery_id', deliveryId);

      if (deleteError) {
        console.error('Error deleting delivery:', deleteError);
        res.status(500).json({ error: 'Failed to delete delivery' });
        return;
      }

      res.status(200).json({ message: 'Delivery deleted successfully' });
    } catch (error) {
      console.error('Error in deleteDelivery:', error);
      res.status(500).json({ error: 'Failed to delete delivery' });
    }
  }

  // Cancel delivery
  static async cancelDelivery(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;
      const farmerId = req.user?.userId;
      const { cancellation_reason } = req.body;

      // Check if delivery exists and belongs to farmer
      const { data: existingDelivery, error: checkError } = await supabase
        .from('fiber_deliveries')
        .select('status, harvest_id')
        .eq('delivery_id', deliveryId)
        .eq('farmer_id', farmerId)
        .single();

      if (checkError || !existingDelivery) {
        res.status(404).json({ error: 'Delivery not found or access denied' });
        return;
      }

      // Only allow cancellation if not already completed
      if (existingDelivery.status === 'Completed' || existingDelivery.status === 'Cancelled') {
        res.status(400).json({ error: 'Cannot cancel completed or already cancelled delivery' });
        return;
      }

      const { data: cancelledDelivery, error: cancelError } = await supabase
        .from('fiber_deliveries')
        .update({
          status: 'Cancelled',
          cancellation_reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('delivery_id', deliveryId)
        .select()
        .single();

      if (cancelError) {
        console.error('Error cancelling delivery:', cancelError);
        res.status(500).json({ error: 'Failed to cancel delivery' });
        return;
      }

      // Return fiber to inventory by updating harvest status back to 'In Inventory'
      if (cancelledDelivery.harvest_id) {
        const { error: inventoryUpdateError } = await supabase
          .from('harvests')
          .update({
            status: 'In Inventory',
            updated_at: new Date().toISOString()
          })
          .eq('harvest_id', cancelledDelivery.harvest_id);

        if (inventoryUpdateError) {
          console.error('Warning: Failed to return fiber to inventory:', inventoryUpdateError);
          // Don't fail the cancellation, just log the error
        } else {
          console.log('✅ Fiber returned to inventory:', cancelledDelivery.harvest_id);
        }
      }

      res.status(200).json({
        message: 'Delivery cancelled successfully. Fiber returned to inventory.',
        delivery: cancelledDelivery
      });
    } catch (error) {
      console.error('Error in cancelDelivery:', error);
      res.status(500).json({ error: 'Failed to cancel delivery' });
    }
  }

  // Get all deliveries (for CUSAFA/Admin)
  static async getAllDeliveries(req: Request, res: Response) {
    try {
      const { status, buyer_id, farmer_id, start_date, end_date } = req.query;

      let query = supabase
        .from('fiber_deliveries')
        .select(`
          *,
          buyers (
            business_name,
            contact_number,
            business_address
          ),
          farmers (
            full_name,
            contact_number,
            municipality,
            barangay
          ),
          harvests (
            farmer_name
          )
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (buyer_id) {
        query = query.eq('buyer_id', buyer_id);
      }
      if (farmer_id) {
        query = query.eq('farmer_id', farmer_id);
      }
      if (start_date) {
        query = query.gte('delivery_date', start_date);
      }
      if (end_date) {
        query = query.lte('delivery_date', end_date);
      }

      const { data: deliveries, error } = await query;

      if (error) {
        console.error('Error fetching all deliveries:', error);
        res.status(500).json({ error: 'Failed to fetch deliveries' });
        return;
      }

      res.status(200).json({ deliveries });
    } catch (error) {
      console.error('Error in getAllDeliveries:', error);
      res.status(500).json({ error: 'Failed to fetch deliveries' });
    }
  }

  // Update delivery status (for CUSAFA/Admin)
  static async updateDeliveryStatus(req: Request, res: Response) {
    try {
      const { deliveryId } = req.params;
      const { status, notes } = req.body;

      const validStatuses = ['In Transit', 'Delivered', 'Completed', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Set timestamp based on status
      if (status === 'Delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'Completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.payment_status = 'Paid';
        updateData.payment_date = new Date().toISOString();
      } else if (status === 'Cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancellation_reason = notes;
      }

      if (notes) {
        updateData.notes = notes;
      }

      const { data: updatedDelivery, error } = await supabase
        .from('fiber_deliveries')
        .update(updateData)
        .eq('delivery_id', deliveryId)
        .select()
        .single();

      if (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ error: 'Failed to update delivery status' });
        return;
      }

      // Return fiber to inventory if status is changed to Cancelled
      if (status === 'Cancelled' && updatedDelivery.harvest_id) {
        const { error: inventoryUpdateError } = await supabase
          .from('harvests')
          .update({
            status: 'In Inventory',
            updated_at: new Date().toISOString()
          })
          .eq('harvest_id', updatedDelivery.harvest_id);

        if (inventoryUpdateError) {
          console.error('Warning: Failed to return fiber to inventory:', inventoryUpdateError);
          // Don't fail the status update, just log the error
        } else {
          console.log('✅ Fiber returned to inventory:', updatedDelivery.harvest_id);
        }
      }

      res.status(200).json({
        message: status === 'Cancelled'
          ? 'Delivery cancelled successfully. Fiber returned to inventory.'
          : 'Delivery status updated successfully',
        delivery: updatedDelivery
      });
    } catch (error) {
      console.error('Error in updateDeliveryStatus:', error);
      res.status(500).json({ error: 'Failed to update delivery status' });
    }
  }
}
