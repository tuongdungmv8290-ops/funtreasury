-- Allow authenticated users to insert their own address labels
CREATE POLICY "Users can insert own address_labels"
ON public.address_labels
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Allow users to view their own address labels
CREATE POLICY "Users can view own address_labels"
ON public.address_labels
FOR SELECT
USING (auth.uid() = created_by);

-- Allow users to update their own address labels
CREATE POLICY "Users can update own address_labels"
ON public.address_labels
FOR UPDATE
USING (auth.uid() = created_by);

-- Allow users to delete their own address labels
CREATE POLICY "Users can delete own address_labels"
ON public.address_labels
FOR DELETE
USING (auth.uid() = created_by);