insert into public.checklist_checks (id, name, rule, position) values
  ('order_confirmed', 'Order confirmed', 'Says the order ID back to the customer to confirm which order the call is about', 1),
  ('problem_understood', 'Problem understood', 'Says back what went wrong with the order before the customer has to explain it again', 2),
  ('frustration_acknowledged', 'Frustration acknowledged', 'Recognises the customer''s frustration, for example "I understand this is frustrating"', 3),
  ('solution_or_next_step', 'Solution or next step', 'Offers a refund, replacement or clear delivery time within the company''s rules', 4),
  ('smooth_handover', 'Smooth handover', 'The human agent shows they already know the problem when they take the call (Not needed when there is no handover)', 5),
  ('closing', 'Closing', 'Checks the customer is happy with the outcome before ending', 6);

insert into public.checklist_red_flags (id, name, example, position) values
  ('human_not_transferred', 'Customer asked for a human and wasn''t transferred', '"Mujhe kisi insaan se baat karni hai", and the AI carries on', 1),
  ('agent_loop', 'Agent stuck in a loop', '"Sorry, I didn''t understand. Please tell me your order ID", three times in a row', 2),
  ('wrong_promise', 'Wrong or made-up promise', '"You''ll get a full refund and ₹500 extra", when the rules don''t allow it', 3),
  ('safety_not_escalated', 'Safety issue not escalated', '"There was an insect in my food", and the call isn''t passed to a person', 4);

update public.company_rules
set text = 'Late delivery over 45 minutes: a coupon of up to ₹50. Refunds only for missing, wrong or damaged items, after the customer sends a photo. No cash compensation.'
where id = 1;
