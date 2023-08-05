//controle de autenticação
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import authConfig from '@/config/auth';
import crypto from 'crypto';
import Mailer from '@/modules/Mailer';
import jwt from 'jsonwebtoken';
import User from '@/app/schemas/User';
import { error } from 'console';

const router = new Router();

const generateToken = (params) => {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  });
};

router.post('/Auth/register', (req, res) => {
  // #swagger.tags = ['User']
  // #swagger.description = 'Endpoint para registrar um usuário.'
  const { email, name, password } = req.body;

  User.findOne({ email })
    .then((userData) => {
      if (userData) {
        return res.status(400).send({ error: 'User already exists' });
      } else {
        User.create({ name, email, password })
          .then((user) => {
            user.password = undefined;
            return res.send({ user });
          })
          .catch((error) => {
            console.error('Erro ao salvar o usuário', error);
            return res.status(400).send({ error: 'Registration failed.' });
          });
      }
    })
    .catch((error) => {
      console.error('Erro ao consultar usuário no banco de dados', error);
      return res.status(500).send({ error: 'Registration failed' });
    });
});

router.post('/Auth/login', (req, res) => {
  // #swagger.tags = ['User']
  // #swagger.description = 'Endpoint para fazer login.'
  const { email, name, password } = req.body;

  User.findOne({ email })
    .select('+password')
    .then((user) => {
      if (user) {
        bcrypt
          .compare(password, user.password)
          .then((result) => {
            if (result) {
              const token = generateToken({
                uid: user.id,
                administrador: user.administrador,
              });
              return res.send({ token: token, tokenExpiration: '1d' });
            } else {
              return res.status(400).send({ error: 'Invalid password' });
            }
          })
          .catch((error) => {
            console.error('Erro ao verificar senha', error);
            return res.status(500).send({ error: 'Internal server error' });
          });
      } else {
        return res.status(404).send({ error: 'User not found' });
      }
    })
    .catch((error) => {
      console.error('Erro ao logar', error);
      return res.status(500).send({ error: 'Internal server error' });
    });
});

router.post('/Auth/forgot-password', (req, res) => {
  // #swagger.tags = ['User']
  // #swagger.description = 'Endpoint para fazer requisição de um token de recuperação de senha.'
  const { email } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (user) {
        const token = crypto.randomBytes(20).toString('hex');
        const expiration = new Date();
        expiration.setHours(new Date().getHours() + 3);

        User.findByIdAndUpdate(user.id, {
          $set: {
            passwordResetToken: token,
            passwordResetTokenExpiration: expiration,
          },
        })
          .then(() => {
            Mailer.sendMail(
              {
                to: email,
                from: 'webmaster@testeexpress.com',
                template: 'auth/forgot_password',
                context: { token },
              },
              (error) => {
                if (error) {
                  console.error('Erro ao enviar email', error);
                  return res
                    .status(400)
                    .send({ error: 'Fail sending recover password mail' });
                } else {
                  return res.send();
                }
              },
            );
          })
          .catch((error) => {
            console.error(
              'Erro ao salvar o token de recuperação de senha',
              error,
            );
            return res.status(500).send({ error: 'Internal server error' });
          });
      } else {
        return res.status(404).send({ error: 'User not found' });
      }
    })
    .catch((error) => {
      console.error('Erro no forgot password', error);
      return res.status(500).send({ error: 'Internal server error' });
    });
});

router.post('/Auth/reset-password', (req, res) => {
  // #swagger.tags = ['User']
  // #swagger.description = 'Endpoint para trocar a senha.'
  const { email, token, newPassword } = req.body;

  User.findOne({ email })
    .select('+passwordResetToken passwordResetTokenExpiration')
    .then((user) => {
      if (user) {
        if (
          token != user.passwordResetToken ||
          new Date().now > user.passwordResetTokenExpiration
        ) {
          return res.status(400).send({ error: 'Invalid Token.' });
        } else {
          user.passwordResetToken = undefined;
          user.passwordResetTokenExpiration = undefined;
          user.password = newPassword;

          user
            .save()
            .then(() => {
              return res.send({ message: 'Senha trocada com sucesso' });
            })
            .catch((error) => {
              console.error('Erro ao salvar nova senha do usuário', error);
              return res.status(500).send({ error: 'Internal server error' });
            });
        }
      } else {
        return res.status(404).send({ error: 'User not found' });
      }
    })
    .catch((error) => {
      console.error('Erro no forgot password', error);
      return res.status(500).send({ error: 'Internal server error' });
    });
});

export default router;
