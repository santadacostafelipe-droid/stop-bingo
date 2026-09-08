/**
 * Stop & Bingo — Servidor Node.js (multi-sala)
 *
 * Cada sala tem um código único de 5 caracteres. Quem cria a sala vira o
 * "anfitrião" (tela de computador = painel administrador). Jogadores entram
 * digitando nome + código da sala e caem direto no jogo pelo celular.
 * Cada sala mantém seu próprio estado isolado, para que várias turmas/salas
 * possam jogar ao mesmo tempo sem interferir umas nas outras.
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
// Sem 0/O e 1/I para não confundir na hora de digitar o código.
const CHARSET_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// ------------------------------------------------------------------
// SALAS — cada código de sala mapeia para um estado de jogo isolado
// ------------------------------------------------------------------
const salas = new Map();

function gerarCodigoSala() {
  let codigo;
  do {
    codigo = '';
    for (let i = 0; i < 5; i++) {
      codigo += CHARSET_CODIGO[Math.floor(Math.random() * CHARSET_CODIGO.length)];
    }
  } while (salas.has(codigo));
  return codigo;
}

function novoJogador(nome) {
  return {
    nome,
    pontosStop: {},
    totalStop: 0,
    votoRodada: {},
    votouTudo: false,
    pronto: false,
    pontosBingo: 0,
    palavras: []
  };
}

function estadoInicial(codigo) {
  return {
    codigo,
    jogo: null,
    jogadores: [],
    temaAtual: TEMAS[0],
    rodada: 1,
    letraAtual: null,
    finalizado: false,
    temas: TEMAS,
    criadoEm: Date.now(),
    ultimaAtividade: Date.now()
  };
}

function recalcTotalStop(jogador) {
  jogador.totalStop = Object.values(jogador.pontosStop).reduce((a, b) => a + b, 0);
}

function broadcastEstado(sala) {
  io.to(sala.codigo).emit('estado_atualizado', sala);
}

function notificar(sala, mensagem) {
  io.to(sala.codigo).emit('notificacao', { mensagem, ts: Date.now() });
}

function encontrarJogador(sala, nome) {
  return sala.jogadores.find(j => j.nome.toLowerCase() === nome.toLowerCase());
}

// Recupera a sala do socket e marca atividade recente (evita limpeza automática).
function obterSala(socket) {
  const codigo = socket.data.codigo;
  if (!codigo) return null;
  const sala = salas.get(codigo);
  if (sala) sala.ultimaAtividade = Date.now();
  return sala;
}

function novaRodadaStop(sala, letra) {
  if (sala.letraAtual !== null) sala.rodada += 1;
  sala.letraAtual = letra;
  sala.jogadores.forEach(j => {
    j.votoRodada = {};
    j.votouTudo = false;
    j.pronto = false;
  });
}

function finalizarRodadaStopEAvancar(sala) {
  sala.jogadores.forEach(j => {
    TEMAS.forEach(t => {
      const v = j.votoRodada[t] !== undefined ? j.votoRodada[t] : 0;
      j.pontosStop[t] = (j.pontosStop[t] || 0) + v;
    });
    recalcTotalStop(j);
  });
  const novaLetra = LETRAS[Math.floor(Math.random() * LETRAS.length)];
  novaRodadaStop(sala, novaLetra);
  notificar(sala, `🎡 Todos votaram! Nova rodada: letra ${novaLetra}`);
}

function verificarTodosVotaram(sala) {
  if (sala.jogo !== 'stop') return;
  if (sala.jogadores.length === 0) return;
  const todos = sala.jogadores.every(j => j.votouTudo);
  if (todos) finalizarRodadaStopEAvancar(sala);
}

io.on('connection', (socket) => {
  socket.data.codigo = null;
  socket.data.papel = null;
  socket.data.nome = null;

  // ---------------- Criação / entrada em sala ----------------
  socket.on('criar_sala', () => {
    const codigo = gerarCodigoSala();
    const sala = estadoInicial(codigo);
    salas.set(codigo, sala);
    socket.join(codigo);
    socket.data.codigo = codigo;
    socket.data.papel = 'admin';
    socket.emit('sala_criada', { codigo });
    socket.emit('estado_atualizado', sala);
  });

  socket.on('reconectar_admin', (codigo) => {
    codigo = (codigo || '').toString().trim().toUpperCase();
    const sala = salas.get(codigo);
    if (!sala) {
      socket.emit('erro_sala', { mensagem: 'Essa sala não existe mais (o servidor pode ter reiniciado).' });
      return;
    }
    socket.join(codigo);
    socket.data.codigo = codigo;
    socket.data.papel = 'admin';
    sala.ultimaAtividade = Date.now();
    socket.emit('sala_criada', { codigo });
    socket.emit('estado_atualizado', sala);
  });

  socket.on('entrar_sala', ({ codigo, nome }) => {
    codigo = (codigo || '').toString().trim().toUpperCase();
    nome = (nome || '').toString().trim().slice(0, 20);
    const sala = salas.get(codigo);
    if (!sala) {
      socket.emit('erro_sala', { mensagem: 'Código de sala inválido ou sala expirada. Confira com o anfitrião.' });
      return;
    }
    if (!nome) {
      socket.emit('erro_sala', { mensagem: 'Digite um nome válido para entrar.' });
      return;
    }
    let jogador = encontrarJogador(sala, nome);
    if (!jogador) {
      jogador = novoJogador(nome);
      // Se entrar no meio de uma rodada de Stop já em andamento, não trava
      // a rodada atual esperando o voto de quem acabou de chegar.
      if (sala.jogo === 'stop' && sala.letraAtual !== null) {
        jogador.votouTudo = true;
        jogador.pronto = true;
      }
      sala.jogadores.push(jogador);
      notificar(sala, `🙋 <b>${jogador.nome}</b> entrou na sala!`);
    }
    socket.join(codigo);
    socket.data.codigo = codigo;
    socket.data.papel = 'jogador';
    socket.data.nome = jogador.nome;
    sala.ultimaAtividade = Date.now();
    socket.emit('sala_entrada_ok', { codigo, nome: jogador.nome });
    broadcastEstado(sala);
  });

  socket.on('encerrar_sala', () => {
    const sala = obterSala(socket);
    if (!sala) return;
    io.to(sala.codigo).emit('sala_encerrada');
    salas.delete(sala.codigo);
  });

  // ---------------- Config / geral ----------------
  socket.on('set_jogo', (tipo) => {
    const sala = obterSala(socket);
    if (!sala) return;
    if (tipo !== 'stop' && tipo !== 'bingo') return;
    sala.jogo = tipo;
    broadcastEstado(sala);
  });

  socket.on('adicionar_jogador', (nome) => {
    const sala = obterSala(socket);
    if (!sala) return;
    nome = (nome || '').toString().trim().slice(0, 20);
    if (!nome) return;
    if (encontrarJogador(sala, nome)) return;
    const jogador = novoJogador(nome);
    if (sala.jogo === 'stop' && sala.letraAtual !== null) {
      jogador.votouTudo = true;
      jogador.pronto = true;
    }
    sala.jogadores.push(jogador);
    broadcastEstado(sala);
  });

  socket.on('remover_jogador', (nome) => {
    const sala = obterSala(socket);
    if (!sala) return;
    sala.jogadores = sala.jogadores.filter(j => j.nome !== nome);
    broadcastEstado(sala);
    verificarTodosVotaram(sala);
    broadcastEstado(sala);
  });

  socket.on('girar_roleta', () => {
    const sala = obterSala(socket);
    if (!sala) return;
    const letra = LETRAS[Math.floor(Math.random() * LETRAS.length)];
    if (sala.jogo === 'stop') {
      novaRodadaStop(sala, letra);
      notificar(sala, `🎲 Nova rodada sorteada: letra ${letra}`);
    } else {
      sala.letraAtual = letra;
    }
    broadcastEstado(sala);
  });

  socket.on('definir_letra_manual', (letra) => {
    const sala = obterSala(socket);
    if (!sala) return;
    letra = (letra || '').toString().trim().toUpperCase();
    if (!LETRAS.includes(letra)) return;
    if (sala.jogo === 'stop') {
      novaRodadaStop(sala, letra);
      notificar(sala, `📍 Letra definida manualmente: ${letra}`);
    } else {
      sala.letraAtual = letra;
    }
    broadcastEstado(sala);
  });

  socket.on('zerar_pontos_stop', () => {
    const sala = obterSala(socket);
    if (!sala) return;
    sala.jogadores.forEach(j => {
      j.pontosStop = {};
      j.totalStop = 0;
      j.votoRodada = {};
      j.votouTudo = false;
    });
    notificar(sala, '🔄 Pontuações do Stop foram zeradas.');
    broadcastEstado(sala);
  });

  socket.on('forcar_proxima_rodada_stop', () => {
    const sala = obterSala(socket);
    if (!sala || sala.jogo !== 'stop') return;
    finalizarRodadaStopEAvancar(sala);
    broadcastEstado(sala);
  });

  socket.on('set_tema_bingo', (tema) => {
    const sala = obterSala(socket);
    if (!sala) return;
    if (!TEMAS.includes(tema)) return;
    sala.temaAtual = tema;
    broadcastEstado(sala);
  });

  socket.on('finalizar_jogo', () => {
    const sala = obterSala(socket);
    if (!sala) return;
    sala.finalizado = true;
    const ranking = [...sala.jogadores].sort((a, b) => {
      const pa = sala.jogo === 'stop' ? a.totalStop : a.pontosBingo;
      const pb = sala.jogo === 'stop' ? b.totalStop : b.pontosBingo;
      return pb - pa;
    }).map(j => ({
      nome: j.nome,
      totalStop: j.totalStop,
      pontosBingo: j.pontosBingo,
      pontosStop: j.pontosStop
    }));
    io.to(sala.codigo).emit('jogo_finalizado', { jogo: sala.jogo, ranking });
    broadcastEstado(sala);
  });

  // Reinicia o JOGO mas mantém a sala e os jogadores conectados, para dar
  // pra jogar várias partidas seguidas sem precisar reentrar com o código.
  socket.on('reiniciar_jogo', () => {
    const sala = obterSala(socket);
    if (!sala) return;
    sala.jogo = null;
    sala.temaAtual = TEMAS[0];
    sala.rodada = 1;
    sala.letraAtual = null;
    sala.finalizado = false;
    sala.jogadores.forEach(j => {
      j.pontosStop = {};
      j.totalStop = 0;
      j.votoRodada = {};
      j.votouTudo = false;
      j.pronto = false;
      j.pontosBingo = 0;
      j.palavras = [];
    });
    broadcastEstado(sala);
  });

  // ---------------- Stop: votação ----------------
  socket.on('jogador_pronto', ({ nome }) => {
    const sala = obterSala(socket);
    if (!sala) return;
    const j = encontrarJogador(sala, nome);
    if (!j) return;
    if (!j.pronto) {
      j.pronto = true;
      notificar(sala, `🙋 <b>${j.nome}</b> está pronto(a) para a rodada!`);
      broadcastEstado(sala);
    }
  });

  socket.on('marcar_ponto_stop', ({ nome, tema, pontos }) => {
    const sala = obterSala(socket);
    if (!sala) return;
    const j = encontrarJogador(sala, nome);
    if (!j || !TEMAS.includes(tema)) return;
    pontos = Number(pontos);
    if (![10, 5, 0].includes(pontos)) return;
    j.votoRodada[tema] = pontos;
    j.pronto = true;
    const completou = TEMAS.every(t => j.votoRodada[t] !== undefined);
    if (completou && !j.votouTudo) {
      j.votouTudo = true;
      notificar(sala, `✅ <b>${j.nome}</b> terminou de votar nesta rodada!`);
    }
    broadcastEstado(sala);
    verificarTodosVotaram(sala);
  });

  // ---------------- Bingo ----------------
  socket.on('enviar_palavra_bingo', ({ nome, palavra }) => {
    const sala = obterSala(socket);
    if (!sala) return;
    const j = encontrarJogador(sala, nome);
    if (!j || !sala.letraAtual || !palavra) return;
    palavra = palavra.toString().trim();
    if (!palavra) return;
    // Guarda o TEMA que estava ativo no momento do envio junto com a palavra,
    // para que trocar o tema depois não bagunce a validação de palavras antigas.
    const idx = j.palavras.findIndex(p => p.letra === sala.letraAtual && p.tema === sala.temaAtual);
    const entrada = { tema: sala.temaAtual, letra: sala.letraAtual, palavra };
    if (idx >= 0) j.palavras[idx] = entrada;
    else j.palavras.push(entrada);
    notificar(sala, `📝 <b>${j.nome}</b> enviou uma palavra para ${sala.temaAtual} / letra ${sala.letraAtual}`);
    broadcastEstado(sala);
  });

  socket.on('limpar_palavras_bingo', () => {
    const sala = obterSala(socket);
    if (!sala) return;
    sala.jogadores.forEach(j => { j.palavras = []; });
    notificar(sala, '🗑️ Palavras do Bingo foram limpas.');
    broadcastEstado(sala);
  });

  socket.on('solicitar_validacao_bingo', ({ nome }) => {
    const sala = obterSala(socket);
    if (!sala) return;
    notificar(sala, `🎰 <b>${nome}</b> pediu BINGO!`);
    io.to(sala.codigo).emit('solicitacao_bingo', { nome });
  });

  // Validação manual e editável: o admin manda uma lista de entradas
  // {tema, letra, palavra} — pode vir pré-preenchida com o que o jogador
  // enviou pelo celular, mas o admin pode editar, remover ou adicionar
  // linhas à mão antes de validar (útil quando o jogo é conduzido de forma
  // mais livre, por exemplo com uma roleta física em sala de aula).
  socket.on('validar_bingo', ({ nome, entradas }) => {
    const sala = obterSala(socket);
    if (!sala) return;
    const j = encontrarJogador(sala, nome);
    if (!j) {
      socket.emit('erro_bingo', { mensagem: `Jogador "${nome}" não encontrado.` });
      return;
    }
    entradas = Array.isArray(entradas) ? entradas : [];
    entradas = entradas
      .map(e => ({
        tema: (e && e.tema || '').toString(),
        letra: (e && e.letra || '').toString().toUpperCase(),
        palavra: (e && e.palavra || '').toString().trim()
      }))
      .filter(e => TEMAS.includes(e.tema) && LETRAS.includes(e.letra) && e.palavra);

    if (entradas.length === 0) {
      socket.emit('erro_bingo', { mensagem: `Nenhuma palavra válida para validar de ${j.nome}.` });
      return;
    }

    const detalhes = entradas.map(e => {
      const dicionarioTema = DICIONARIO[e.tema];
      const esperado = dicionarioTema ? (dicionarioTema[e.letra] || null) : null;
      const correta = !!esperado && esperado.toLowerCase() === e.palavra.toLowerCase();
      return { tema: e.tema, letra: e.letra, palavra: e.palavra, esperado, correta };
    });

    const todasCorretas = detalhes.every(d => d.correta);

    if (todasCorretas) {
      j.pontosBingo += 1;
      notificar(sala, `🎉 BINGO válido de <b>${j.nome}</b>!`);
      io.to(sala.codigo).emit('bingo_valido', { nome: j.nome, detalhes, pontosBingo: j.pontosBingo });
    } else {
      j.pontosBingo = Math.max(0, j.pontosBingo - 1);
      notificar(sala, `❌ BINGO inválido de <b>${j.nome}</b>.`);
      io.to(sala.codigo).emit('bingo_invalido', { nome: j.nome, detalhes, pontosBingo: j.pontosBingo });
    }

    j.palavras = [];
    broadcastEstado(sala);
  });

  socket.on('disconnect', () => {
    // A sala continua existindo em memória — quem cair consegue reconectar
    // com o mesmo código (admin) ou mesmo nome + código (jogador).
  });
});

// Limpeza periódica: remove salas sem nenhuma atividade há muitas horas,
// para não acumular memória indefinidamente em um servidor de longa duração.
const LIMITE_INATIVIDADE_MS = 6 * 60 * 60 * 1000; // 6 horas
setInterval(() => {
  const agora = Date.now();
  for (const [codigo, sala] of salas) {
    if (agora - sala.ultimaAtividade > LIMITE_INATIVIDADE_MS) {
      salas.delete(codigo);
    }
  }
}, 30 * 60 * 1000); // checa a cada 30 minutos

server.listen(PORT, () => {
  console.log(`🎉 Stop & Bingo rodando na porta ${PORT}`);
});
