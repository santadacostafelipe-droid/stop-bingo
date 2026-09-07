/**
 * Stop & Bingo — Servidor Node.js
 * Express serve o front-end estático, Socket.IO sincroniza o estado do jogo
 * em tempo real entre o(s) computador(es) administrador(es) e os celulares
 * dos jogadores.
 *
 * MECÂNICA DO STOP (nova):
 * - Cada rodada sorteia (ou o admin define manualmente) UMA letra.
 * - Todos os jogadores veem a letra e os 8 temas ao mesmo tempo, e votam
 *   10 / 5 / 0 em CADA tema.
 * - Assim que um jogador vota em todos os 8 temas, ele fica "completo".
 * - Quando TODOS os jogadores da partida ficam completos, o sistema soma
 *   os pontos da rodada ao total de cada um e avança sozinho para uma nova
 *   letra automaticamente.
 * - O admin também pode definir a letra manualmente (ex: usando uma roleta
 *   física em sala de aula) ou forçar o avanço da rodada a qualquer momento.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------------------------------------------
// DICIONÁRIO OFICIAL — usado apenas no servidor para validar o Bingo
// ------------------------------------------------------------------
const DICIONARIO = {
  Person: { A: 'Adam', B: 'Ben', C: 'Chris', D: 'Daniel', E: 'Emma', F: 'Fred', G: 'George', H: 'Harry', I: 'Isabella', J: 'Jack', K: 'Kevin', L: 'Lucas', M: 'Maria', N: 'Noah', O: 'Olivia', P: 'Peter', Q: 'Quentin', R: 'Robert', S: 'Sophia', T: 'Thomas', U: 'Uma', V: 'Victoria', W: 'William', X: 'Xavier', Y: 'Yusuf', Z: 'Zach' },
  Food: { A: 'Apple', B: 'Burger', C: 'Cake', D: 'Donut', E: 'Egg', F: 'Fries', G: 'Grapes', H: 'Hamburger', I: 'Ice cream', J: 'Jelly', K: 'Kiwi', L: 'Lemon', M: 'Mango', N: 'Nachos', O: 'Orange', P: 'Pizza', Q: 'Quiche', R: 'Rice', S: 'Sandwich', T: 'Taco', U: 'Udon', V: 'Vanilla', W: 'Waffles', X: 'Xiaolongbao', Y: 'Yogurt', Z: 'Zucchini' },
  Place: { A: 'Australia', B: 'Brazil', C: 'Canada', D: 'Denmark', E: 'Egypt', F: 'France', G: 'Germany', H: 'Hawaii', I: 'India', J: 'Japan', K: 'Kenya', L: 'London', M: 'Mexico', N: 'Norway', O: 'Oman', P: 'Portugal', Q: 'Qatar', R: 'Rome', S: 'Spain', T: 'Thailand', U: 'Uganda', V: 'Venezuela', W: 'Wales', X: 'Xiamen', Y: 'Yemen', Z: 'Zambia' },
  Color: { A: 'Amber', B: 'Blue', C: 'Cyan', D: 'Dark blue', E: 'Emerald', F: 'Fuchsia', G: 'Green', H: 'Hazel', I: 'Indigo', J: 'Jade', K: 'Khaki', L: 'Lilac', M: 'Magenta', N: 'Navy', O: 'Olive', P: 'Pink', Q: 'Quartz', R: 'Red', S: 'Silver', T: 'Turquoise', U: 'Ultramarine', V: 'Violet', W: 'White', X: 'Xanthic', Y: 'Yellow', Z: 'Zaffre' },
  Job: { A: 'Artist', B: 'Baker', C: 'Chef', D: 'Doctor', E: 'Engineer', F: 'Farmer', G: 'Gardener', H: 'Hairdresser', I: 'Illustrator', J: 'Journalist', K: 'Karate instructor', L: 'Lawyer', M: 'Mechanic', N: 'Nurse', O: 'Optician', P: 'Pilot', Q: 'Quarry worker', R: 'Receptionist', S: 'Scientist', T: 'Teacher', U: 'Umpire', V: 'Veterinarian', W: 'Waiter', X: 'X-ray technician', Y: 'Yoga instructor', Z: 'Zookeeper' },
  Verb: { A: 'Ask', B: 'Buy', C: 'Cook', D: 'Dance', E: 'Eat', F: 'Fly', G: 'Go', H: 'Help', I: 'Imagine', J: 'Jump', K: 'Kick', L: 'Laugh', M: 'Make', N: 'Need', O: 'Open', P: 'Play', Q: 'Quit', R: 'Run', S: 'Sing', T: 'Talk', U: 'Use', V: 'Visit', W: 'Walk', X: 'X-ray', Y: 'Yell', Z: 'Zoom' },
  Object: { A: 'Axe', B: 'Book', C: 'Chair', D: 'Door', E: 'Eraser', F: 'Fork', G: 'Glass', H: 'Hammer', I: 'Iron', J: 'Jacket', K: 'Key', L: 'Lamp', M: 'Mirror', N: 'Notebook', O: 'Oven', P: 'Pencil', Q: 'Quilt', R: 'Ruler', S: 'Spoon', T: 'Table', U: 'Umbrella', V: 'Vase', W: 'Watch', X: 'Xylophone', Y: 'Yo-yo', Z: 'Zipper' },
  Animal: { A: 'Ant', B: 'Bear', C: 'Cat', D: 'Dog', E: 'Elephant', F: 'Fox', G: 'Giraffe', H: 'Horse', I: 'Iguana', J: 'Jaguar', K: 'Kangaroo', L: 'Lion', M: 'Monkey', N: 'Newt', O: 'Otter', P: 'Panda', Q: 'Quail', R: 'Rabbit', S: 'Snake', T: 'Tiger', U: 'Urchin', V: 'Vulture', W: 'Wolf', X: 'Xerus', Y: 'Yak', Z: 'Zebra' }
};

const TEMAS = Object.keys(DICIONARIO);
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// ------------------------------------------------------------------
// ESTADO GLOBAL DO JOGO
// ------------------------------------------------------------------
function novoJogador(nome) {
  return {
    nome,
    pontosStop: {},      // { tema: pontosAcumulados }
    totalStop: 0,
    votoRodada: {},       // { tema: 10|5|0 } — respostas da rodada ATUAL (Stop)
    votouTudo: false,     // true quando respondeu os 8 temas da rodada atual
    pronto: false,        // confirmou presença nesta rodada
    pontosBingo: 0,
    palavras: []          // [{letra, palavra}] pendentes de validação (Bingo)
  };
}

function estadoInicial() {
  return {
    jogo: null,           // 'stop' | 'bingo'
    jogadores: [],
    temaAtual: TEMAS[0],   // usado apenas pelo Bingo
    rodada: 1,
    letraAtual: null,
    finalizado: false,
    temas: TEMAS
  };
}

let state = estadoInicial();

function recalcTotalStop(jogador) {
  jogador.totalStop = Object.values(jogador.pontosStop).reduce((a, b) => a + b, 0);
}

function broadcastEstado() {
  io.emit('estado_atualizado', state);
}

function notificar(mensagem) {
  io.emit('notificacao', { mensagem, ts: Date.now() });
}

function encontrarJogador(nome) {
  return state.jogadores.find(j => j.nome === nome);
}

// Inicia uma nova rodada de Stop com a letra informada: reseta os votos e
// o status de "pronto"/"completo" de todos os jogadores.
function novaRodadaStop(letra) {
  if (state.letraAtual !== null) state.rodada += 1;
  state.letraAtual = letra;
  state.jogadores.forEach(j => {
    j.votoRodada = {};
    j.votouTudo = false;
    j.pronto = false;
  });
}

// Fecha a rodada atual do Stop: soma os votos de todos (quem não votou em
// algum tema recebe 0 nele), e sorteia a próxima letra automaticamente.
function finalizarRodadaStopEAvancar() {
  state.jogadores.forEach(j => {
    TEMAS.forEach(t => {
      const v = j.votoRodada[t] !== undefined ? j.votoRodada[t] : 0;
      j.pontosStop[t] = (j.pontosStop[t] || 0) + v;
    });
    recalcTotalStop(j);
  });
  const novaLetra = LETRAS[Math.floor(Math.random() * LETRAS.length)];
  novaRodadaStop(novaLetra);
  notificar(`🎡 Todos votaram! Nova rodada: letra ${novaLetra}`);
}

function verificarTodosVotaram() {
  if (state.jogo !== 'stop') return;
  if (state.jogadores.length === 0) return;
  const todos = state.jogadores.every(j => j.votouTudo);
  if (todos) finalizarRodadaStopEAvancar();
}

io.on('connection', (socket) => {
  socket.emit('estado_inicial', state);

  // ---------------- Config / geral ----------------
  socket.on('set_jogo', (tipo) => {
    if (tipo !== 'stop' && tipo !== 'bingo') return;
    state.jogo = tipo;
    broadcastEstado();
  });

  socket.on('adicionar_jogador', (nome) => {
    nome = (nome || '').toString().trim();
    if (!nome) return;
    if (encontrarJogador(nome)) return;
    state.jogadores.push(novoJogador(nome));
    broadcastEstado();
  });

  socket.on('remover_jogador', (nome) => {
    state.jogadores = state.jogadores.filter(j => j.nome !== nome);
    broadcastEstado();
    verificarTodosVotaram();
    if (state.jogadores.length) broadcastEstado();
  });

  // Sorteia uma letra aleatória (roleta virtual). No Stop, isso sempre
  // inicia uma rodada nova (zera votos de todos).
  socket.on('girar_roleta', () => {
    const letra = LETRAS[Math.floor(Math.random() * LETRAS.length)];
    if (state.jogo === 'stop') {
      novaRodadaStop(letra);
      notificar(`🎲 Nova rodada sorteada: letra ${letra}`);
    } else {
      state.letraAtual = letra;
    }
    broadcastEstado();
  });

  // Define a letra manualmente (ex: usando uma roleta física em sala de aula).
  socket.on('definir_letra_manual', (letra) => {
    letra = (letra || '').toString().trim().toUpperCase();
    if (!LETRAS.includes(letra)) return;
    if (state.jogo === 'stop') {
      novaRodadaStop(letra);
      notificar(`📍 Letra definida manualmente: ${letra}`);
    } else {
      state.letraAtual = letra;
    }
    broadcastEstado();
  });

  socket.on('zerar_pontos_stop', () => {
    state.jogadores.forEach(j => {
      j.pontosStop = {};
      j.totalStop = 0;
      j.votoRodada = {};
      j.votouTudo = false;
    });
    notificar('🔄 Pontuações do Stop foram zeradas.');
    broadcastEstado();
  });

  // Força o fim da rodada mesmo que nem todos tenham votado (quem não
  // votou recebe 0 nos temas pendentes) — útil se alguém travar/sumir.
  socket.on('forcar_proxima_rodada_stop', () => {
    if (state.jogo !== 'stop') return;
    finalizarRodadaStopEAvancar();
    broadcastEstado();
  });

  socket.on('set_tema_bingo', (tema) => {
    if (!TEMAS.includes(tema)) return;
    state.temaAtual = tema;
    broadcastEstado();
  });

  socket.on('finalizar_jogo', () => {
    state.finalizado = true;
    const ranking = [...state.jogadores].sort((a, b) => {
      const pa = state.jogo === 'stop' ? a.totalStop : a.pontosBingo;
      const pb = state.jogo === 'stop' ? b.totalStop : b.pontosBingo;
      return pb - pa;
    }).map(j => ({
      nome: j.nome,
      totalStop: j.totalStop,
      pontosBingo: j.pontosBingo,
      pontosStop: j.pontosStop
    }));
    io.emit('jogo_finalizado', { jogo: state.jogo, ranking });
    broadcastEstado();
  });

  socket.on('reiniciar_jogo', () => {
    state = estadoInicial();
    broadcastEstado();
  });

  // ---------------- Stop: votação ----------------
  socket.on('jogador_pronto', ({ nome }) => {
    const j = encontrarJogador(nome);
    if (!j) return;
    if (!j.pronto) {
      j.pronto = true;
      notificar(`🙋 ${j.nome} está pronto(a) para a rodada!`);
      broadcastEstado();
    }
  });

  socket.on('marcar_ponto_stop', ({ nome, tema, pontos }) => {
    const j = encontrarJogador(nome);
    if (!j || !TEMAS.includes(tema)) return;
    pontos = Number(pontos);
    if (![10, 5, 0].includes(pontos)) return;
    j.votoRodada[tema] = pontos;
    j.pronto = true;
    const completou = TEMAS.every(t => j.votoRodada[t] !== undefined);
    if (completou && !j.votouTudo) {
      j.votouTudo = true;
      notificar(`✅ ${j.nome} terminou de votar nesta rodada!`);
    }
    broadcastEstado();
    verificarTodosVotaram();
  });

  // ---------------- Bingo ----------------
  socket.on('enviar_palavra_bingo', ({ nome, palavra }) => {
    const j = encontrarJogador(nome);
    if (!j || !state.letraAtual || !palavra) return;
    palavra = palavra.toString().trim();
    if (!palavra) return;
    const idx = j.palavras.findIndex(p => p.letra === state.letraAtual);
    const entrada = { letra: state.letraAtual, palavra };
    if (idx >= 0) j.palavras[idx] = entrada;
    else j.palavras.push(entrada);
    notificar(`📝 ${j.nome} enviou uma palavra para a letra ${state.letraAtual}`);
    broadcastEstado();
  });

  socket.on('limpar_palavras_bingo', () => {
    state.jogadores.forEach(j => { j.palavras = []; });
    notificar('🗑️ Palavras do Bingo foram limpas.');
    broadcastEstado();
  });

  socket.on('solicitar_validacao_bingo', ({ nome }) => {
    notificar(`🎰 ${nome} pediu BINGO!`);
    io.emit('solicitacao_bingo', { nome });
  });

  socket.on('validar_bingo', (nome) => {
    const j = encontrarJogador(nome);
    if (!j) {
      socket.emit('erro_bingo', { mensagem: `Jogador "${nome}" não encontrado.` });
      return;
    }
    const dicionarioTema = DICIONARIO[state.temaAtual];
    if (!dicionarioTema) {
      socket.emit('erro_bingo', { mensagem: 'Tema atual inválido.' });
      return;
    }
    if (j.palavras.length === 0) {
      socket.emit('erro_bingo', { mensagem: `${j.nome} ainda não enviou nenhuma palavra.` });
      return;
    }

    const detalhes = j.palavras.map(p => {
      const esperado = dicionarioTema[p.letra] || null;
      const correta = !!esperado && esperado.toLowerCase() === p.palavra.toLowerCase();
      return { letra: p.letra, palavra: p.palavra, esperado, correta };
    });

    const todasCorretas = detalhes.every(d => d.correta);

    if (todasCorretas) {
      j.pontosBingo += 1;
      notificar(`🎉 BINGO válido de ${j.nome}!`);
      io.emit('bingo_valido', { nome: j.nome, detalhes, pontosBingo: j.pontosBingo });
    } else {
      j.pontosBingo = Math.max(0, j.pontosBingo - 1);
      notificar(`❌ BINGO inválido de ${j.nome}.`);
      io.emit('bingo_invalido', { nome: j.nome, detalhes, pontosBingo: j.pontosBingo });
    }

    j.palavras = [];
    broadcastEstado();
  });
});

server.listen(PORT, () => {
  console.log(`🎉 Stop & Bingo rodando na porta ${PORT}`);
});
