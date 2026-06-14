/**
 * Google AdSense configuration.
 *
 * The loader script (in the root layout) enables **Auto Ads** as soon as Auto
 * Ads is switched on in the AdSense dashboard — no slot IDs required.
 *
 * For the controlled, non-intrusive manual placements (a bottom-of-page banner
 * and a unit below each game) create display ad units in AdSense and paste
 * their slot IDs below. While a slot is empty the placement renders nothing,
 * so gameplay is never pushed around by an empty box.
 */
export const AD_CLIENT = "ca-pub-2087141992057731";

export const AD_SLOTS = {
  /** home page unit */
  home: "5789788385",
  /** Perfect Season result screen unit (shown after the game is over) */
  result: "6838809461",
  /** responsive banner at the bottom of every page (no unit yet) */
  inline: "",
  /** unit below each mini-game, after gameplay (no unit yet) */
  game: "",
};
