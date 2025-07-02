namespace asp;

entity Country {
  key code : String(2);      // ISO code like 'IN'
      name : String(100);    // Full name like 'India'
}

aspect WithCountry {
  country_code : String(2);

  country : Association to Country
    on country.code = $self.country_code;
}
