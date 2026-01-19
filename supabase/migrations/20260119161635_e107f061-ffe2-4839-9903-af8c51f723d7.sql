-- Fix function search path for update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Fix function search path for handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;