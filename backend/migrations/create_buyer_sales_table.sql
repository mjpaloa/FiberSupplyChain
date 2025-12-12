-- Create buyer_sales table to track when buyers sell their inventory to customers
CREATE TABLE IF NOT EXISTS buyer_sales (
    sale_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL,
    fiber_class VARCHAR(50) NOT NULL,
    quantity_kg DECIMAL(10, 2) NOT NULL CHECK (quantity_kg > 0),
    price_per_kg DECIMAL(10, 2) NOT NULL CHECK (price_per_kg > 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount > 0),
    buyer_name VARCHAR(255) NOT NULL,
    notes TEXT,
    sale_date TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_buyer_sales_seller_id ON buyer_sales(seller_id);
CREATE INDEX idx_buyer_sales_fiber_class ON buyer_sales(fiber_class);
CREATE INDEX idx_buyer_sales_sale_date ON buyer_sales(sale_date);
CREATE INDEX idx_buyer_sales_created_at ON buyer_sales(created_at);

-- Add comment to table
COMMENT ON TABLE buyer_sales IS 'Tracks sales made by buyers from their fiber inventory to customers';

-- Add comments to columns
COMMENT ON COLUMN buyer_sales.sale_id IS 'Unique identifier for the sale';
COMMENT ON COLUMN buyer_sales.seller_id IS 'Reference to the buyer (user) who made the sale';
COMMENT ON COLUMN buyer_sales.fiber_class IS 'Class of fiber sold (Class A, Class B, Class C)';
COMMENT ON COLUMN buyer_sales.quantity_kg IS 'Quantity of fiber sold in kilograms';
COMMENT ON COLUMN buyer_sales.price_per_kg IS 'Selling price per kilogram';
COMMENT ON COLUMN buyer_sales.total_amount IS 'Total amount of the sale (quantity_kg * price_per_kg)';
COMMENT ON COLUMN buyer_sales.buyer_name IS 'Name of the customer who purchased the fiber';
COMMENT ON COLUMN buyer_sales.notes IS 'Optional notes about the sale';
COMMENT ON COLUMN buyer_sales.sale_date IS 'Date when the sale was made';
