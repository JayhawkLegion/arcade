/* Shared leaderboard for the arcade: a Google Apps Script web app bound to a
 * Google Sheet. The sheet IS the board -- it only ever holds the top five of
 * each game, so you can read, fix or delete entries there directly.
 *
 * Setup (once): in the Google Sheet, Extensions -> Apps Script, replace the
 * editor's contents with this file, save, then Deploy -> New deployment ->
 * type "Web app", Execute as "Me", Who has access "Anyone". Copy the /exec URL
 * into ARCADE_LEADERBOARD_URL in index.html (inside the self-hosted block).
 * After editing this file later, use Deploy -> Manage deployments -> edit ->
 * Version "New version" so the same URL keeps working.
 *
 *   GET  <url>                    -> {ok, board:{game:[{initials, score, detail, when}]}}
 *   POST <url>  body: JSON text    {game, initials, score, detail}
 *                                 -> {ok, rank, board}   rank 0 = did not make the top five
 *
 * The browser posts with a text/plain body so no CORS preflight is needed.
 * Nothing here can prove a score was really earned; it only checks the shape.
 * The sheet is the place to delete anything that looks wrong.
 */
var GAMES = ["rally", "astro", "snake", "drift", "battery", "hopper", "invaders", "blocks", "lander", "sortie"];
var KEEP = 5;
var SHEET = "Leaderboard";
var TZ = "America/Chicago";
var HEAD = ["Game", "Initials", "Score", "Detail", "Central time", "UTC"];

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight("bold");
    sh.setFrozenRows(1);
    /* plain text, so Sheets never turns initials or timestamps into something else */
    sh.getRange("A:B").setNumberFormat("@");
    sh.getRange("D:F").setNumberFormat("@");
  }
  return sh;
}

function rows_(sh) {
  var n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  return sh.getRange(2, 1, n, HEAD.length).getValues()
    .filter(function (r) { return r[0] !== "" && r[0] !== null; })
    .map(function (r) {
      return {game: String(r[0]).trim(), initials: String(r[1]).trim(), score: Number(r[2]) || 0,
              detail: String(r[3]), ct: String(r[4]), utc: String(r[5])};
    });
}

/* best first; on a tie the earlier score keeps its place */
function cmp_(a, b) { return b.score - a.score || (a.utc < b.utc ? -1 : a.utc > b.utc ? 1 : 0); }

function ranked_(rows, game) {
  return rows.filter(function (r) { return r.game === game; }).sort(cmp_).slice(0, KEEP);
}

function board_(rows) {
  var out = {};
  GAMES.forEach(function (g) {
    out[g] = ranked_(rows, g).map(function (r) {
      return {initials: r.initials, score: r.score, detail: r.detail, when: r.ct};
    });
  });
  return out;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ok: true, board: board_(rows_(sheet_()))});
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ok: false, error: "bad request"}); }
  var game = String(d.game || "");
  var initials = String(d.initials || "").toUpperCase();
  var score = Math.floor(Number(d.score));
  var detail = String(d.detail || "").replace(/[\r\n\t]/g, " ").slice(0, 40);
  if (GAMES.indexOf(game) < 0) return json_({ok: false, error: "unknown game"});
  if (!/^[A-Z]{3}$/.test(initials)) return json_({ok: false, error: "initials must be three letters"});
  if (!(score > 0 && score < 100000000)) return json_({ok: false, error: "bad score"});

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = sheet_(), rows = rows_(sh), top = ranked_(rows, game);
    if (top.length >= KEEP && score <= top[KEEP - 1].score) {
      return json_({ok: true, rank: 0, board: board_(rows)});
    }
    var now = new Date();
    var entry = {game: game, initials: initials, score: score, detail: detail,
                 ct: Utilities.formatDate(now, TZ, "yyyy-MM-dd h:mm a z"),
                 utc: Utilities.formatDate(now, "UTC", "yyyy-MM-dd HH:mm:ss")};
    rows.push(entry);

    /* rewrite the sheet as the board: each game's top five, games in arcade order */
    var keep = [];
    GAMES.forEach(function (g) { keep = keep.concat(ranked_(rows, g)); });
    rows.forEach(function (r) { if (GAMES.indexOf(r.game) < 0) keep.push(r); });   /* never drop rows we don't own */
    var last = sh.getLastRow();
    if (last > 1) sh.getRange(2, 1, last - 1, HEAD.length).clearContent();
    if (keep.length) {
      sh.getRange(2, 1, keep.length, HEAD.length).setValues(keep.map(function (r) {
        return [r.game, r.initials, r.score, r.detail, r.ct, r.utc];
      }));
    }
    var rank = ranked_(keep, game).indexOf(entry) + 1;
    return json_({ok: true, rank: rank, board: board_(keep)});
  } finally {
    lock.releaseLock();
  }
}
