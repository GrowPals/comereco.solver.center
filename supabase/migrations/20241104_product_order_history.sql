-- Function to get product order history for a specific user
CREATE OR REPLACE FUNCTION get_product_order_history(
  p_product_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  product_id UUID,
  last_ordered TIMESTAMP WITH TIME ZONE,
  total_ordered NUMERIC,
  average_quantity NUMERIC,
  order_count BIGINT
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ri.product_id,
    MAX(r.created_at) as last_ordered,
    SUM(ri.quantity) as total_ordered,
    AVG(ri.quantity) as average_quantity,
    COUNT(DISTINCT r.id) as order_count
  FROM requisition_items ri
  INNER JOIN requisitions r ON r.id = ri.requisition_id
  WHERE ri.product_id = p_product_id
    AND r.created_by = p_user_id
    AND r.status IN ('approved', 'delivered', 'completed')
  GROUP BY ri.product_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_product_order_history(UUID, UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_product_order_history(UUID, UUID) IS
'Returns order history statistics for a specific product and user, including last order date, total quantity ordered, average quantity per order, and total number of orders';