update public.calls
set error_code = 'gnani_failed'
where error_code = 'transcription_failed'
  and error like '% segments failed permanently, above the % tolerance';
