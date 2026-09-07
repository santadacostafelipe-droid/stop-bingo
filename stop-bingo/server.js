/**
 * Stop & Bingo — Servidor Node.js
 * Express serve o front-end estático, Socket.IO sincroniza o estado do jogo
 * em tempo real entre o(s) computador(es) administrador(es) e os celulares
 * dos jogadores.
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
function estadoInicial() {
  return {
    jogo: null,           // 'stop' | 'bingo'
    jogadores: [],         // { nome, pontosStop:{tema:pontos}, totalStop, pontosBingo, palavras:[{letra,palavra}] }
    temaAtual: TEMAS[0],
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

function encontrarJogador(nome) {
  return state.jogadores.find(j => j.nome === nome);
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
    state.jogadores.push({
      nome,
      pontosStop: {},
      totalStop: 0,
      pontosBingo: 0,
      palavras: []
    });
    broadcastEstado();
  });

  socket.on('remover_jogador', (nome) => {
    state.jogadores = state.jogadores.filter(j => j.nome !== nome);
    broadcastEstado();
  });

  socket.on('girar_roleta', () => {
    state.letraAtual = LETRAS[Math.floor(Math.random() * LETRAS.length)];
    broadcastEstado();
  });

  socket.on('mudar_tema_stop', (tema) => {
    if (!TEMAS.includes(tema)) return;
    state.temaAtual = tema;
    broadcastEstado();
  });

  socket.on('set_tema_bingo', (tema) => {
    if (!TEMAS.includes(tema)) return;
    state.temaAtual = tema;
    broadcastEstado();
  });

  socket.on('proxima_rodada_stop', () => {
    state.rodada += 1;
    broadcastEstado();
  });

  socket.on('zerar_pontos_stop', () => {
    state.jogadores.forEach(j => {
      j.pontosStop = {};
      j.totalStop = 0;
    });
    broadcastEstado();
  });

  socket.on('finalizar_jogo', () => {
    state.finalizado = true;
    const ranking = [...state.jogadores].sort((a, b) => {
      const pa = state.jogo === 'stop' ? a.totalStop : a.pontosBingo;
      const pb = state.jogo === 'stop' ? b.totalStop : b.pontosBingo;
      return pb - pa;
    });
    io.emit('jogo_finalizado', ranking);
    broadcastEstado();
  });

  socket.on('reiniciar_jogo', () => {
    state = estadoInicial();
    broadcastEstado();
  });

  // ---------------- Stop ----------------
  socket.on('marcar_ponto_stop', ({ nome, pontos }) => {
    const j = encontrarJogador(nome);
    if (!j) return;
    pontos = Number(pontos);
    if (![10, 5, 0].includes(pontos)) return;
    j.pontosStop[state.temaAtual] = (j.pontosStop[state.temaAtual] || 0) + pontos;
    recalcTotalStop(j);
    broadcastEstado();
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
    broadcastEstado();
  });

  socket.on('limpar_palavras_bingo', () => {
    state.jogadores.forEach(j => { j.palavras = []; });
    broadcastEstado();
  });

  socket.on('solicitar_validacao_bingo', ({ nome }) => {
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
      io.emit('bingo_valido', { nome: j.nome, detalhes, pontosBingo: j.pontosBingo });
    } else {
      j.pontosBingo = Math.max(0, j.pontosBingo - 1);
      io.emit('bingo_invalido', { nome: j.nome, detalhes, pontosBingo: j.pontosBingo });
    }

    j.palavras = [];
    broadcastEstado();
  });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
