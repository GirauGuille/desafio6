import express from 'express';
import './db/dbConfig.js';
import { __dirname } from './utils/dirname.js';
import handlebars from 'express-handlebars';
import { Server } from 'socket.io';
import apiRouter from './routes/api.router.js';
import viewsRouter from './routes/views.router.js';
import { messagesModel } from './db/models/messages.model.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import FileStore from 'session-file-store';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import './passport/passportStrategies.js'

const app = express();
const PORT = 8080;
const FileStoreSession = FileStore(session);

/* cookie */
app.use(cookieParser());

/* middlewares */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(__dirname + '/public/html'));
app.use(express.static(__dirname + '/public'));

/* handlebars */
app.engine('handlebars', handlebars.engine());
app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');

// session para manejar sesiones de usuario en el servidor (cookies) usando FileStore para guardar las sesiones en el servidor (en archivos)
// app.use(session({
//     store: new FileStoreSession({
//         // nombre de la carpeta donde se guardarán los archivos de sesión
//         path: __dirname + '/sessions',
//         //ttl: 60 * 60 * 24 * 7, // 1 semana
//     }),
//     // resave es false para que no se guarde la sesión en cada petición
//     resave: false,
//     // saveUninitialized es false para que no se guarde la sesión en cada petición si no hay cambios en la sesión
//     saveUninitialized: false,
//     // secret es una cadena de texto que se usa para firmar la cookie de sesión
//     secret: 'secreto',
//     // maxAge es el tiempo de vida de la cookie de sesión en milisegundos
//     cookie: {maxAge: 1000 * 60 * 60 * 24 * 7} // 1 semana
// }));

app.use(session({
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://girauguillermo:giraug@cluster0.bfpv0cy.mongodb.net/electrogirau?retryWrites=true&w=majority',
    }),
    resave: false,
    saveUninitialized: false,
    secret: 'secreto',

    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 1 semana
}));

/* passport para autenticación de usuarios */
app.use(passport.initialize());
app.use(passport.session());


app.use('/api', apiRouter);
app.use('/', viewsRouter)
app.get('/', (req, res) => {
    res.redirect('/login');
});
app.set("port", process.env.PORT || 8080);

/* server */
const httpServer = app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${httpServer.address().port}`);
    console.log(`http://localhost:${PORT}`);});
    httpServer.on("error", error => console.log(`Error en servidor: ${error.message}`));


// websocket

const io = new Server(httpServer)

io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`)

    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`)
    })

    socket.on("message", async (data) => {

        const newMessage = new messagesModel({
            user: data.user,
            message: data.msg,
        });
        await newMessage.save();

        socket.broadcast.emit("message", data)
    })

    socket.on('usuarioNuevo', async (usuario) => {
        socket.broadcast.emit('broadcast', usuario)

        const messages = await messagesModel.find();

        socket.emit('chat', messages)
    })
})