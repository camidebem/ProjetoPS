import { Router } from 'express';
import Project from '@/app/schemas/Project';
import Slugify from '@/utils/slugify';
import AuthMiddleware from '@/app/middlewares/Auth';
import AdminMiddleware from '@/app/middlewares/Admin';
import Multer from '@/app/middlewares/Multer';

const router = new Router();

router.get('/agenda/', (req, res) => {
  // #swagger.tags = ['Project']
  // #swagger.description = 'Endpoint para obter todas as tarefas.'
  Project.find()
    .then((data) => {
      const projects = data.map((project) => {
        return {
          title: project.title,
          category: project.category,
          description: project.description,
          priority: project.priority,
          deadline: project.deadline,
          slug: project.slug,
          featuredImage: project.featuredImage,
        };
      });
      res.send(projects);
    })
    .catch((error) => {
      console.error('Erro ao obter os dados do projeto. ', error);
      return res.status(400).send({
        error: 'Não foi possível obter os dados do projeto. Tente novamente. ',
      });
    });
});

router.get('/agenda/:projectTitle', (req, res) => {
  // #swagger.tags = ['Project']
  // #swagger.description = 'Endpoint para obter uma tarefa pelo título.'
  Project.findOne({ title: req.params.projectTitle })
    .then((project) => {
      res.send(project);
    })
    .catch((error) => {
      console.error('Erro ao salvar novo projeto no banco de dados.', error);
      return res.status(400).send({
        error:
          'Não foi possível salvar projeto. Verifique os dados e tente novamente.',
      });
    });
});

router.post('/agenda', AuthMiddleware, (req, res) => {
  // #swagger.tags = ['Project']
  // #swagger.description = 'Endpoint para criar uma nova tarefa.'
  const { title, description, category, priority, deadline } = req.body;

  Project.create({ title, description, category, priority, deadline })
    .then((project) => {
      res.status(200).send(project);
    })
    .catch((error) => {
      console.error('Erro ao salvar novo projeto no banco de dados.', error);
      return res.status(400).send({
        error:
          'Não foi possível salvar projeto. Verifique os dados e tente novamente.',
      });
    });
});

router.put(
  '/agenda/:projectId',
  AuthMiddleware,
  AdminMiddleware,
  (req, res) => {
    // #swagger.tags = ['Project']
    // #swagger.description = 'Endpoint para editar uma tarefa.'
    const { title, description, category, priority, deadline } = req.body;
    let slug = undefined;
    if (title) {
      slug = Slugify(title);
    }

    Project.findByIdAndUpdate(
      req.params.projectId,
      { title, slug, description, category, priority, deadline },
      { new: true },
    )
      .then((project) => {
        res.status(200).send(project);
      })
      .catch((error) => {
        console.error(
          'Erro ao atualizar novo projeto no banco de dados.',
          error,
        );
        return res.status(400).send({
          error:
            'Não foi possível atualizar projeto. Verifique os dados e tente novamente.',
        });
      });
  },
);

router.delete(
  '/agenda/:projectId',
  [AuthMiddleware, AdminMiddleware],
  (req, res) => {
    // #swagger.tags = ['Project']
    // #swagger.description = 'Endpoint para deletar um usuário.'
    Project.findByIdAndRemove(req.params.projectId)
      .then(() => {
        res.send({ message: 'Projeto removido com sucesso!' });
      })
      .catch((error) => {
        console.error('Erro ao remover o projeto no banco de dados.', error);
        return res.status(400).send({
          message:
            'Não foi possível remover o projeto. Verifique os dados e tente novamente.',
        });
      });
  },
);

router.post(
  '/agenda/featured-image/:projectId',
  [AuthMiddleware, Multer.single('featuredImage')],
  (req, res) => {
    // #swagger.tags = ['Project']
    // #swagger.description = 'Endpoint para fazer upload da imagem principal.'
    const { file } = req;
    if (file) {
      Project.findByIdAndUpdate(
        req.params.projectId,
        {
          $set: {
            featuredImage: file.path,
          },
        },
        { new: true },
      )
        .then((project) => {
          return res.send({ project });
        })
        .catch((error) => {
          console.error('Erro ao associar imagem ao projeto', error);
          return res
            .status(500)
            .send({ error: 'Ocorreu um erro, tente novamente' });
        });
    } else {
      return res.status(400).send({ error: 'Nenhuma imagem enviada' });
    }
  },
);
router.post('/agenda/images/:projectId', Multer.array('images'), (req, res) => {
  // #swagger.tags = ['Project']
  // #swagger.description = 'Endpoint para adicionar uma ou mais imagens a um projeto pelo seu ID.'
  const { files } = req;

  if (files && files.length > 0) {
    const images = [];
    files.forEach((file) => {
      images.push(file.filename);
    });
    Project.findByIdAndUpdate(
      req.params.projectId,
      {
        $set: { images },
      },
      { new: true },
    )
      .then((project) => {
        return res.send({ project });
      })
      .catch((error) => {
        console.error('Erro ao associar imagens ao projeto', error);
        return res
          .status(500)
          .send({ error: 'Ocorreu um erro, tente novamente' });
      });
  } else {
    return res.status(400).send({ error: 'Nenhuma imagem enviada' });
  }
});
export default router;
