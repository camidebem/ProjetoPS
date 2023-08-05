//conexão com o banco de dados
import mongoose from 'mongoose';

mongoose

  .connect('mongodb://127.0.0.1:27017/agenda-pessoal', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('connected'))
  .catch((e) => console.log('ERRO: ', e));
mongoose.Promise = global.Promise;

export default mongoose;
