import express, { Router } from 'express';
import bodyParser from 'body-parser';
import { Agenda, Auth, Uploads } from '@/app/controllers';
import User from './app/schemas/User';
import swaggerUi from 'swagger-ui-express';

const app = express();
const port = 3000;
const swaggerFile = require('./swagger_output.json');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(Agenda);
app.use(Auth);
app.use('/uploads', Uploads);

function createAdminUser() {
  const name = 'Camily';
  const email = 'camily@compjr.com';
  const password = '123';
  const administrador = true;

  User.findOne({ email })
    .then((userData) => {
      if (userData) {
        console.log('Usuário administrador já existe.');
        return;
      }

      const novoUsuario = new User({
        name,
        email,
        password,
        administrador,
      });
      novoUsuario
        .save()
        .then(() => {
          console.log('Usuário admin criado com sucesso');
        })
        .catch((error) => {
          console.error('Erro ao criar usuário:', error);
        });
    })
    .catch((error) => {
      console.error('Erro ao consultar usuário no banco de dados:', error);
    });
}
createAdminUser();
console.log(`Servidor rodando no link http://localhost:${port}`);
app.listen(port);
