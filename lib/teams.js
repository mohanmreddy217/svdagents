// Teams that belong to the Internal team section. Viewers must never receive these members.
const INTERNAL = ['COUPONS BD TEAM', 'COUPONS SALES TEAM', 'COUPONS TELE TEAM', 'INTERNAL TEAM'];
const ALIAS = { 'SV DEVELOPERS': 'INTERNAL TEAM', 'BD TEAM': 'COUPONS BD TEAM', 'SALES TEAM': 'COUPONS SALES TEAM', 'COUPANS TELE TEAM': 'COUPONS TELE TEAM', 'COUPENS TELE TEAM': 'COUPONS TELE TEAM', 'COUPONS TELE': 'COUPONS TELE TEAM' };
exports.isInternal = (team) => INTERNAL.includes(ALIAS[team] || team);
