/* TOEP! advertentie- en aankooplaag — webdemo, GEEN echte betaalintegratie.
 * Beveiligingsregel: nooit advertenties permanent uitschakelen op basis
 * van een onbevestigd localStorage-vlaggetje. Verifieer store-aankopen native.
 * Voor productie: zie STAPPENPLAN.md en officiële StoreKit/Play Billing docs.
 */
'use strict';
const TOEPMonetization = (() => {
  const PRODUCT_ID = 'remove_ads'; // Configureer hetzelfde product-ID per winkel.
  let verifiedEntitlement = false;
  const supportsStore = false; // Pas wijzigen na echte native integratie.
  function render(){
    const status = document.getElementById('premiumState');
    if (status) status.textContent = verifiedEntitlement
      ? 'Advertentievrij actief — aankoop bevestigd door de appwinkel.'
      : 'Webdemo: betalingen en echte advertenties zijn nog niet aangesloten.';
    document.querySelectorAll('[data-ad-slot]').forEach(el => {
      el.hidden = verifiedEntitlement;
    });
  }
  function explain(){
    window.showModal?.('Nog niet beschikbaar',
      'Dit is een veilige demo. Je wordt niet afgerekend. De eenmalige aankoop van €3,99 wordt pas mogelijk nadat Google Play Billing / Apple StoreKit en aankoopverificatie zijn aangesloten.');
  }
  // Wordt later vervangen door native winkel-API plus gecontroleerde entitlement.
  async function buy(){ if (!supportsStore) return explain(); }
  async function restore(){ if (!supportsStore) return explain(); }
  function init(){render();}
  return Object.freeze({PRODUCT_ID,init,render,buy,restore});
})();
