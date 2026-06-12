
REVOKE EXECUTE ON FUNCTION public.record_note_download(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_note_download(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_note_download(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_note_download(UUID, UUID) TO service_role;
