#1  On registered athletes account it is the issue :
Minified React error #185; visit https://react.dev/errors/185 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
Error: Minified React error #185; visit https://react.dev/errors/185 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at Ir (https://atletismsibiu.ro/index-yqTBNlc3.js:10:31980)
    at Tr (https://atletismsibiu.ro/index-yqTBNlc3.js:10:31505)
    at mo (https://atletismsibiu.ro/index-yqTBNlc3.js:10:63840)
    at uo (https://atletismsibiu.ro/index-yqTBNlc3.js:10:63452)
    at m (https://atletismsibiu.ro/ui-vendors-DN_DdXvS.js:1:957)
    at https://atletismsibiu.ro/ui-vendors-DN_DdXvS.js:1:1048
    at Array.map (<anonymous>)
    at https://atletismsibiu.ro/ui-vendors-DN_DdXvS.js:1:1032
    at m (https://atletismsibiu.ro/ui-vendors-DN_DdXvS.js:1:957)
    at https://atletismsibiu.ro/ui-vendors-DN_DdXvS.js:1:1048

    Clarifications on register form all fields are in place: Tip cont, antrenor, Data nasterii, gender, prenume, nume, incarca poza(avatar), enmail, parola reintroduceti parola. it will create user and also athlete profile.
  on form from superadmin adding an athlete account is only email, password, prenume, nume, incarca poza(avatar), rol...so it will create only user but no athlete profile.

  Expected 

  #2 Same situation on parent creation. On register you can choose antrenor and child on superadmin only user is created no link between coach athlete

  #3 Check consistency on user registration or creation by superadmin or coach.

  #4 On roles manager checking or uncheckin boxes to activate deactivate permisions have no efect to users roles