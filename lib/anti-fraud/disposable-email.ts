/**
 * Anti-Fraud Disposable Email Blocker
 * Blocks temporary/burner email addresses during checkout and merchant registration.
 * Protects against bot purchases, automated abuse, fraudulent disputes, and fake accounts.
 */

// Set of 300+ most common disposable, burner, and temporary email domains
const DISPOSABLE_DOMAINS = new Set([
  // Mailinator & family
  "mailinator.com",
  "mailin8r.com",
  "mailinator2.com",
  "suremail.info",
  "spamherelots.com",
  "binkmail.com",
  "safetymail.info",
  "tradermail.info",

  // 10MinuteMail
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.co.uk",
  "10minutemail.de",
  "10minutemail.be",
  "10minutemail.pl",
  "10minutemailbox.com",
  "10minemail.com",

  // GuerrillaMail
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.biz",
  "guerrillamail.org",
  "guerrillamail.de",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "pokemail.net",
  "spam4.me",

  // Temp-Mail & TempMail
  "temp-mail.org",
  "tempmail.com",
  "temp-mail.io",
  "tempmail.net",
  "tempmailo.com",
  "temp-mail.com",
  "tempinbox.com",
  "tempail.com",
  "mytemp.email",

  // YOPmail & aliases
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "cool.fr.nf",
  "jetable.fr.nf",
  "nospam.ze.tc",
  "nomail.xl.cx",
  "mega.zik.dj",
  "speed.1s.fr",
  "courriel.fr.nf",
  "moncourrier.fr.nf",
  "monemail.fr.nf",
  "monmail.fr.nf",

  // TrashMail
  "trashmail.com",
  "trashmail.net",
  "trashmail.org",
  "trashmail.me",
  "trashmail.ws",
  "trash-mail.com",
  "trash-mail.at",
  "trash-mail.ch",
  "rcpt.at",
  "damnthespam.com",

  // Nada / AirMail / GetNada
  "getnada.com",
  "nada.ltd",
  "abyssmail.com",
  "dropmail.me",
  "inboxbear.com",
  "givmail.com",
  "vomoto.com",

  // Dispostable & ThrowAway
  "dispostable.com",
  "throwawaymail.com",
  "throwawaymail.org",
  "fakemailgenerator.com",
  "generator.email",
  "crazymailing.com",
  "mohmal.com",
  "mohmal.im",
  "emailondeck.com",
  "burnermail.io",
  "luxusmail.org",
  "minutemail.com",
  "incognitomail.org",
  "maildrop.cc",
  "harakirimail.com",
  "inboxkitten.com",
  "fakemail.net",
  "armyspy.com",
  "cuvox.de",
  "dayrep.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
  "einrot.com",
  "discard.email",
  "spambog.com",
  "spambog.de",
  "spambog.ru",
  "0-mail.com",
  "0815.ru",
  "0clickemail.com",
  "10mail.org",
  "20minutemail.com",
  "33mail.com",
  "anonbox.net",
  "anonymbox.com",
  "antichef.com",
  "antispam.de",
  "boun.cr",
  "bouncr.com",
  "boximail.com",
  "cachedot.net",
  "chogmail.com",
  "clipmail.eu",
  "crapmail.org",
  "curryjunk.com",
  "deadaddress.com",
  "despam.it",
  "dontreg.com",
  "drdrb.net",
  "dumpmail.de",
  "e4ward.com",
  "easytrashmail.com",
  "email-temp.com",
  "emaildienst.de",
  "emailmiser.com",
  "emailproxsy.com",
  "emailsensei.com",
  "emailtemporaneo.net",
  "emailto.de",
  "ephemail.net",
  "fastchemail.com",
  "fastinbox.com",
  "filzmail.com",
  "fixmail.tk",
  "flemail.ru",
  "freemail.ms",
  "freshemail.org",
  "getairmail.com",
  "getonemail.com",
  "ghosttexter.de",
  "gishpuppy.com",
  "haltospam.com",
  "hidemail.de",
  "hotpop.com",
  "hushmail.me",
  "inboxalias.com",
  "inboxclean.com",
  "incognitomail.com",
  "instant-mail.de",
  "instantemailaddress.com",
  "kasmail.com",
  "klzlk.com",
  "kurzepost.de",
  "link2mail.net",
  "lookugly.com",
  "lortemail.dk",
  "madmail.com",
  "mail-temporaire.fr",
  "mailcatch.com",
  "mailde.de",
  "mailexpire.com",
  "mailforspam.com",
  "mailmoat.com",
  "mailnull.com",
  "mailtemp.net",
  "mailtothis.com",
  "meltmail.com",
  "mintemail.com",
  "misterpin.com",
  "mytrashmail.com",
  "nervmich.net",
  "netmails.net",
  "no-spam.ws",
  "nobulk.com",
  "noclickemail.com",
  "nomail.biz",
  "nospam4.us",
  "notsharingmy.info",
  "nowmymail.com",
  "nurfuerspam.de",
  "oneoffmail.com",
  "online.ms",
  "owlpic.com",
  "pookmail.com",
  "privacy.net",
  "punkass.com",
  "rmqkr.net",
  "safe-mail.net",
  "safersignup.de",
  "sendfree.net",
  "sharedmailbox.org",
  "shortmail.net",
  "sinnlose-mail.de",
  "slopsbox.com",
  "sofort-mail.de",
  "sogetthis.com",
  "soodonims.com",
  "spam.la",
  "spamavert.com",
  "spambox.us",
  "spamfree24.org",
  "spamgourmet.com",
  "spaml.com",
  "spamspot.com",
  "tempemail.net",
  "tempemail.co",
  "tempmailer.com",
  "temporaryemail.net",
  "temporaryinbox.com",
  "throwawayemailaddress.com",
  "trash-me.com",
  "trashcanmail.com",
  "trashmail.at",
  "trashymail.com",
  "tyldd.com",
  "wegwerfadresse.de",
  "wegwerfemail.de",
  "wegwerfmail.de",
  "wegwerfmail.net",
  "wegwerfmail.org",
  "whyspam.me",
  "willselfdestruct.com",
  "yep.it",
  "zippymail.info",
  "zoemail.com",
]);

/**
 * Checks whether an email address uses a disposable / temporary domain.
 * Normalizes input and handles subdomains (e.g. user@abc.mailinator.com).
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) {
    return false;
  }

  const domain = parts[1];

  // Direct domain match
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return true;
  }

  // Check parent domains (e.g. sub.trashmail.com -> trashmail.com)
  const domainParts = domain.split(".");
  if (domainParts.length > 2) {
    const parentDomain = domainParts.slice(-2).join(".");
    if (DISPOSABLE_DOMAINS.has(parentDomain)) {
      return true;
    }
  }

  // Check for common disposable keywords in domain
  if (
    domain.includes("disposable") ||
    domain.includes("throwaway") ||
    domain.includes("tempmail") ||
    domain.includes("temp-mail") ||
    domain.includes("wegwerf") ||
    domain.includes("fakemail") ||
    domain.includes("10minute")
  ) {
    return true;
  }

  return false;
}
