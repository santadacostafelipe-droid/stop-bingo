const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Serve os arquivos da pasta 'public'
app.use(express.static('public'));

// ============================================================
// DICIONÁRIO COMPLETO (baseado no arquivo enviado)
// ============================================================
const DICIONARIO = {
    Person: {
        'A': 'Adam', 'B': 'Ben', 'C': 'Chris', 'D': 'Daniel', 'E': 'Emma',
        'F': 'Fred', 'G': 'George', 'H': 'Harry', 'I': 'Isabella', 'J': 'Jack',
        'K': 'Kevin', 'L': 'Lucas', 'M': 'Maria', 'N': 'Noah', 'O': 'Olivia',
        'P': 'Peter', 'Q': 'Quentin', 'R': 'Robert', 'S': 'Sophia', 'T': 'Thomas',
        'U': 'Uma', 'V': 'Victoria', 'W': 'William', 'X': 'Xavier', 'Y': 'Yusuf',
        'Z': 'Zach'
    },
    Food: {
        'A': 'Apple', 'B': 'Burger', 'C': 'Cake', 'D': 'Donut', 'E': 'Egg',
        'F': 'Fries', 'G': 'Grapes', 'H': 'Hamburger', 'I': 'Ice cream', 'J': 'Jelly',
        'K': 'Kiwi', 'L': 'Lemon', 'M': 'Mango', 'N': 'Nachos', 'O': 'Orange',
        'P': 'Pizza', 'Q': 'Quiche', 'R': 'Rice', 'S': 'Sandwich', 'T': 'Taco',
        'U': 'Udon', 'V': 'Vanilla', 'W': 'Waffles', 'X': 'Xiaolongbao', 'Y': 'Yogurt',
        'Z': 'Zucchini'
    },
    Place: {
        'A': 'Australia', 'B': 'Brazil', 'C': 'Canada', 'D': 'Denmark', 'E': 'Egypt',
        'F': 'France', 'G': 'Germany', 'H': 'Hawaii', 'I': 'India', 'J': 'Japan',
        'K': 'Kenya', 'L': 'London', 'M': 'Mexico', 'N': 'Norway', 'O': 'Oman',
        'P': 'Portugal', 'Q': 'Qatar', 'R': 'Rome', 'S': 'Spain', 'T': 'Thailand',
        'U': 'Uganda', 'V': 'Venezuela', 'W': 'Wales', 'X': 'Xiamen', 'Y': 'Yemen',
        'Z': 'Zambia'
    },
    Color: {
        'A': 'Amber', 'B': 'Blue', 'C': 'Cyan', 'D': 'Dark blue', 'E': 'Emerald',
        'F': 'Fuchsia', 'G': 'Green', 'H': 'Hazel', 'I': 'Indigo', 'J': 'Jade',
        'K': 'Khaki', 'L': 'Lilac', 'M': 'Magenta', 'N': 'Navy', 'O': 'Olive',
        'P': 'Pink', 'Q': 'Quartz', 'R': 'Red', 'S': 'Silver', 'T': 'Turquoise',
        'U': 'Ultramarine', 'V': 'Violet', 'W': 'White', 'X': 'Xanthic', 'Y': 'Yellow',
        'Z': 'Zaffre'
    },
    Job: {
        'A': 'Artist', 'B': 'Baker', 'C': 'Chef', 'D': 'Doctor', 'E': 'Engineer',
        'F': 'Farmer', 'G': 'Gardener', 'H': 'Hairdresser', 'I': 'Illustrator', 'J': 'Journalist',
        'K': 'Karate instructor', 'L': 'Lawyer', 'M': 'Mechanic', 'N': 'Nurse', 'O': 'Optician',
        'P': 'Pilot', 'Q': 'Quarry worker', 'R': 'Receptionist', 'S': 'Scientist', 'T': 'Teacher',
        'U': 'Umpire', 'V': 'Veterinarian', 'W': 'Waiter', 'X': 'X-ray technician', 'Y': 'Yoga instructor',
        'Z': 'Zookeeper'
    },
    Verb: {
        'A': 'Ask', 'B': 'Buy', 'C': 'Cook', 'D': 'Dance', 'E': 'Eat',
        'F': 'Fly', 'G': 'Go', 'H': 'Help', 'I': 'Imagine', 'J': 'Jump',
        'K': 'Kick', 'L': 'Laugh', 'M': 'Make', 'N': 'Need', 'O': 'Open',
        'P': 'Play', 'Q': 'Quit', 'R': 'Run', 'S': 'Sing', 'T': 'Talk',
        'U': 'Use', 'V': 'Visit', 'W': 'Walk', 'X': 'X-ray', 'Y': 'Yell',
        'Z': 'Zoom'
    },
    Object: {
        'A': 'Axe', 'B': 'Book', 'C': 'Chair', 'D': 'Door', 'E': 'Eraser',
        'F': 'Fork', 'G': 'Glass', 'H': 'Hammer', 'I': 'Iron', 'J': 'Jacket',
        'K': 'Key', 'L': 'Lamp', 'M': 'Mirror', 'N': 'Notebook', 'O': 'Oven',
        'P': 'Pencil', 'Q': 'Quilt', 'R': 'Ruler', 'S': 'Spoon', 'T': 'Table',
        'U': 'Umbrella', 'V': 'Vase', 'W': 'Watch', 'X': 'Xylophone', 'Y': 'Yo-yo',
        'Z': 'Zipper'
    },
    Animal: {
        'A': 'Ant', 'B': 'Bear', 'C': 'Cat', 'D': 'Dog', 'E': 'Elephant',
        'F': 'Fox', 'G': 'Giraffe', 'H': 'Horse', 'I': 'Iguana', 'J': 'Jaguar',
        'K': 'Kangaroo', 'L': 'Lion', 'M': 'Monkey', 'N': 'Newt', 'O': 'Otter',
        'P': 'Panda', 'Q': 'Quail', 'R': 'Rabbit', 'S': 'Snake', 'T': 'Tiger',
        'U': 'Urchin', 'V': 'Vulture', 'W': 'Wolf', 'X': 'Xerus', 'Y': 'Yak',
        'Z': 'Zebra'
    }
};

const TEMAS = ['Person', 'Food', 'Place', 'Color', 'Job', 'Verb', 'Object', 'Animal'];

// ============================================================
// ESTADO DO JOGO (compartilhado)
// ============================================================
const estado = {
    jogo: null,               // 'stop' ou 'bingo'
    jogadores: [],
    rodada: 0,
    letraAtual: '?',
    temaSelecionado: 'Person',
    temasStop: TEMAS,
    pontosStop: {},
    temaBingo: 'Person',
    cartelasBingo: {},
    marcacoesBingo: {},
    palavrasBingo: {},
};

// ============================================================
// SOCKET.IO
// ============================================================
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Envia o estado atual
    socket.emit('estado_inicial', estado);

    // ==========================================================
    // ADMIN
    // ==========================================================

    socket.on('set_jogo', (jogo) => {
        if (jogo === 'stop' || jogo === 'bingo') {
            estado.jogo = jogo;
            io.emit('estado_atualizado', estado);
        }
    });

    socket.on('adicionar_jogador', (nome) => {
        if (!estado.jogadores.some(j => j.nome === nome)) {
            estado.jogadores.push({ nome, pontos: 0 });
            if (estado.jogo === 'stop') {
                estado.pontosStop[nome] = {};
                TEMAS.forEach(t => estado.pontosStop[nome][t] = 0);
            } else {
                // Gera cartela Bingo
                const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                const cartela = [];
                for (let i = 0; i < 9; i++) {
                    const idx = Math.floor(Math.random() * letras.length);
                    cartela.push(letras.splice(idx, 1)[0]);
                }
                estado.cartelasBingo[nome] = cartela;
                estado.marcacoesBingo[nome] = Array(9).fill(false);
                estado.palavrasBingo[nome] = {};
            }
            io.emit('estado_atualizado', estado);
        }
    });

    socket.on('remover_jogador', (nome) => {
        estado.jogadores = estado.jogadores.filter(j => j.nome !== nome);
        delete estado.pontosStop[nome];
        delete estado.cartelasBingo[nome];
        delete estado.marcacoesBingo[nome];
        delete estado.palavrasBingo[nome];
        io.emit('estado_atualizado', estado);
    });

    socket.on('girar_roleta', () => {
        const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const letra = letras[Math.floor(Math.random() * letras.length)];
        estado.letraAtual = letra;
        io.emit('estado_atualizado', estado);
    });

    socket.on('mudar_tema_stop', (tema) => {
        if (TEMAS.includes(tema)) {
            estado.temaSelecionado = tema;
            io.emit('estado_atualizado', estado);
        }
    });

    socket.on('set_tema_bingo', (tema) => {
        if (TEMAS.includes(tema)) {
            estado.temaBingo = tema;
            io.emit('estado_atualizado', estado);
        }
    });

    socket.on('proxima_rodada_stop', () => {
        estado.rodada++;
        io.emit('estado_atualizado', estado);
    });

    socket.on('zerar_pontos_stop', () => {
        estado.jogadores.forEach(j => j.pontos = 0);
        TEMAS.forEach(t => {
            estado.jogadores.forEach(j => {
                if (estado.pontosStop[j.nome]) estado.pontosStop[j.nome][t] = 0;
            });
        });
        io.emit('estado_atualizado', estado);
    });

    socket.on('gerar_novas_cartelas', () => {
        estado.jogadores.forEach(j => {
            const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
            const cartela = [];
            for (let i = 0; i < 9; i++) {
                const idx = Math.floor(Math.random() * letras.length);
                cartela.push(letras.splice(idx, 1)[0]);
            }
            estado.cartelasBingo[j.nome] = cartela;
            estado.marcacoesBingo[j.nome] = Array(9).fill(false);
            estado.palavrasBingo[j.nome] = {};
        });
        io.emit('estado_atualizado', estado);
    });

    socket.on('finalizar_jogo', () => {
        io.emit('jogo_finalizado');
    });

    // ==========================================================
    // JOGADOR (Stop)
    // ==========================================================

    socket.on('marcar_ponto_stop', ({ jogador, tema, pontos }) => {
        if (estado.pontosStop[jogador] && estado.pontosStop[jogador][tema] !== undefined) {
            estado.pontosStop[jogador][tema] = pontos;
            const total = Object.values(estado.pontosStop[jogador]).reduce((a, b) => a + b, 0);
            const j = estado.jogadores.find(j => j.nome === jogador);
            if (j) j.pontos = total;
            io.emit('estado_atualizado', estado);
        }
    });

    // ==========================================================
    // JOGADOR (Bingo)
    // ==========================================================

    socket.on('marcar_celula_bingo', ({ jogador, indice }) => {
        if (estado.marcacoesBingo[jogador]) {
            estado.marcacoesBingo[jogador][indice] = !estado.marcacoesBingo[jogador][indice];
            io.emit('estado_atualizado', estado);
        }
    });

    socket.on('enviar_palavra_bingo', ({ jogador, indice, palavra }) => {
        if (estado.palavrasBingo[jogador]) {
            estado.palavrasBingo[jogador][indice] = palavra;
            io.emit('estado_atualizado', estado);
        }
    });

    socket.on('validar_bingo', (jogador) => {
        const marcacoes = estado.marcacoesBingo[jogador] || [];
        // Verifica linha ou coluna completa
        let linha = -1, coluna = -1;
        for (let i = 0; i < 3; i++) {
            if (marcacoes[i*3] && marcacoes[i*3+1] && marcacoes[i*3+2]) { linha = i; break; }
        }
        if (linha === -1) {
            for (let j = 0; j < 3; j++) {
                if (marcacoes[j] && marcacoes[j+3] && marcacoes[j+6]) { coluna = j; break; }
            }
        }
        if (linha === -1 && coluna === -1) {
            socket.emit('erro_bingo', 'Nenhuma linha ou coluna completa.');
            return;
        }

        const cartela = estado.cartelasBingo[jogador];
        const indices = [];
        if (linha !== -1) {
            for (let j = 0; j < 3; j++) indices.push(linha * 3 + j);
        } else {
            for (let i = 0; i < 3; i++) indices.push(i * 3 + coluna);
        }

        const dicionarioTema = DICIONARIO[estado.temaBingo] || {};
        let todasValidas = true;
        let feedback = '';
        indices.forEach(idx => {
            const letra = cartela[idx];
            const palavra = estado.palavrasBingo[jogador]?.[idx] || '';
            if (!palavra) {
                feedback += `❌ Letra ${letra}: palavra não enviada.\n`;
                todasValidas = false;
                return;
            }
            const esperada = dicionarioTema[letra];
            const valida = esperada && palavra.toLowerCase() === esperada.toLowerCase();
            if (valida) {
                feedback += `✅ ${letra} → "${palavra}" correta.\n`;
            } else {
                feedback += `❌ ${letra} → "${palavra}" inválida (esperado: ${esperada || '?'}).\n`;
                todasValidas = false;
            }
        });

        if (todasValidas) {
            const j = estado.jogadores.find(j => j.nome === jogador);
            if (j) j.pontos += 1;
            estado.marcacoesBingo[jogador] = Array(9).fill(false);
            estado.palavrasBingo[jogador] = {};
            io.emit('estado_atualizado', estado);
            io.emit('bingo_valido', { jogador, feedback });
        } else {
            const j = estado.jogadores.find(j => j.nome === jogador);
            if (j) j.pontos = Math.max(0, j.pontos - 1);
            io.emit('estado_atualizado', estado);
            socket.emit('bingo_invalido', feedback);
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
