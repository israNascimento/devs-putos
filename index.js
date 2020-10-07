var axios = require("axios").default;
var Twit = require("twit");
require("dotenv").config();

const GITHUB_API_URL = "https://api.github.com/search/commits";
const GITHUB_HEADER = {
  Accept: "application/vnd.github.cloak-preview",
};
const TwitterAPI = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
});

const WORDS = [
  "arrombado",
  "bosta",
  "buceta",
  "bunda",
  "caralho",
  "krlho",
  "tomar no cu",
  "toma no cu",
  "pau no cu",
  "teu cu",
  "com o cu",
  "vtnc",
  "desgraca",
  "desgraça",
  "disgraça",
  "foda",
  "fodo",
  "fodido",
  "fodida",
  "fudido",
  "fudida",
  "foder",
  "fuder",
  "foda-se",
  "fodase",
  "merda",
  "porra",
  "puta",
  "putasso",
  "putaço",
  "corno",
  "cacete",
  "caceta",
  "mongoloide",
  "debiloide",
  "escroto",
  "escrota",
  "demonio",
  "demonia",
  "demonho",
  "demonha",
  "diabo",
  "diaba",
  "capeta",
  "idiota",
  "leprosa",
  "leproso",
  "otaria",
  "otario"
];

const latestCommits = [];

function searchLatest() {
  WORDS.forEach((element, index) => {
    setTimeout(() => {
      console.log("Buscando: " + element);
      searchWordOnGithub(element, index);
    }, 10 * 1000 * index);
  });
}

function searchWordOnGithub(word, index) {
  const githubParams = buildQueryParam(word);
  fetchOnGit(githubParams)
    .then((response) => {
      handleLatestResponse(response.data, index);
    })
    .catch((error) => {
      console.log(error + " - " + error.message);
    });
}

function fetchOnGit(params) {
  return axios.get(GITHUB_API_URL, {
    headers: GITHUB_HEADER,
    params: params,
  });
}

var olderTimeout;

function searchOlder() {
  const githubParams = buildRandomQueryParam();
  if (!!olderTimeout) {
    clearTimeout(olderTimeout);
  }
  console.log(
    "Buscando a palavra: " + githubParams.q + " na página: " + githubParams.page
  );
  fetchOnGit(githubParams)
    .then((response) => {
      const items = response.data.items;
      if (items.length != 0) {
        const itemPosition = Math.floor(Math.random() * items.length);
        postToTwitter(items[itemPosition]);
      } else {
        searchOlder();
      }
    })
    .catch((error) => {
      console.log(error + " - " + error.message);
    })
    .finally(() => {
      olderTimeout = setTimeout(searchOlder, process.env.OLDER_INTERVAL);
    });
}

function buildQueryParam(word) {
  return {
    q: word,
    sort: "committer-date",
  };
}

function buildRandomQueryParam() {
  const position = Math.floor(Math.random() * WORDS.length);
  const word = WORDS[position];
  const page = Math.floor(Math.random() * 20);
  return {
    q: word,
    sort: "commiter-date",
    page: page,
  };
}

function handleLatestResponse(data, position) {
  var item = data.items[0];
  if (item.sha == latestCommits[position]) {
    console.log("Não existe novo commit para " + WORDS[position]);
    return;
  }
  latestCommits.splice(position, 0, item.sha);
  postToTwitter(item);
}

function postToTwitter(item) {
  var message = getMessage(item);
  console.log("Postando: " + item.commit.message);
  TwitterAPI.post("statuses/update", { status: message })
    .then((value) => {
      console.log("Mensagem postada com sucesso ");
      console.log("--------------------------");
      console.log("--------------------------");
    })
    .catch((error) => {
      console.log("Twitter error:: ------ ", error.message);
      console.log("--------------------------");
      console.log("--------------------------");
    });
}

function getMessage(item) {
  var commit = item.commit;
  var author = commit.author.name.split(" ")[0];
  return (
    "O/A dev: " +
    author +
    '\ncommitou: "' +
    commit.message +
    '"\n\nlink do repositório: ' +
    getRepositoryURL(item)
  );
}

function getRepositoryURL(item) {
  var url = item.html_url;
  return url.split("/commit/")[0];
}

function initLatest() {
  WORDS.forEach((element, index) => {
    setTimeout(() => {
      console.log("Buscando: " + element);
      fetchInitialWords(element, index);
    }, 10 * 1000 * index);
  });
}

function fetchInitialWords(word, position) {
  const githubParams = buildQueryParam(word);
  fetchOnGit(githubParams)
    .then((response) => {
      var item = response.data.items[0];
      latestCommits.splice(position, 0, item.sha);
    })
    .catch((error) => {
      console.log(error + " - " + error.message);
    });
}

searchOlder();
initLatest();

setInterval(() => {
  searchLatest();
}, 60 * 60 * 1000);

console.log("Iniciando BOT....");
