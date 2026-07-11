-- Revoke public execute on decrement_stock to prevent anonymous clients from calling it
REVOKE EXECUTE ON FUNCTION public.decrement_stock(jsonb) FROM public;
