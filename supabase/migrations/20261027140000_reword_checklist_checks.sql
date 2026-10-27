update public.checklist_checks
set rule = 'Says the order ID back to the customer to confirm which order the call is about'
where id = 'order_confirmed' and rule = 'Confirms which order the call is about';

update public.checklist_checks
set rule = 'Says back what went wrong with the order before the customer has to explain it again'
where id = 'problem_understood' and rule = 'Gets the problem right without making the customer repeat it';

update public.checklist_checks
set rule = 'The human agent shows they already know the problem when they take the call (Not needed when there is no handover)'
where id = 'smooth_handover' and rule = 'Passes the call to a human who already knows the problem (Not needed when there is no handover)';

update public.company_rules set updated_at = now() where id = 1;
