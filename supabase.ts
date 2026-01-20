
import { createClient } from '@supabase/supabase-js';

/* 
  Este arquivo centraliza a conexão com o banco de dados Supabase.
  Para que o sistema funcione, substitua as strings abaixo pelos valores do seu painel:
  Settings (Ícone de Engrenagem) -> API -> Project URL e anon/public Key
*/

const supabaseUrl = 'https://sedtcwyotledhtflqcwc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlZHRjd3lvdGxlZGh0ZmxxY3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTUzODAsImV4cCI6MjA4NDQ5MTM4MH0.98l5C2qNOi7wDL3Ko9o2HUzu7y57XSd4MQkr548OWms';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
