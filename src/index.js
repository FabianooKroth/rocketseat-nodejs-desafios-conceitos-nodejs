const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

const HTTP_CODIGO_SUCESSO = 200;
const HTTP_CODIGO_CRIADO = 201;
const HTTP_CODIGO_SEM_CONTEUDO = 204;
const HTTP_CODIGO_REQUISICAO_INVALIDA = 400;
const HTTP_CODIGO_NAO_AUTORIZADO = 401;
const HTTP_CODIGO_NAO_EXISTE = 404;

function returnResponse(response, statusHttp, jsonObject) {
  if (jsonObject){
    return response.status(statusHttp).json(jsonObject);
  } else if (jsonObject === "") {
    return response.status(statusHttp).json();
  } else {
    return response.status(statusHttp);
  }
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find(user => user.username == username);
  if (!user) {
    return returnResponse(response, HTTP_CODIGO_NAO_AUTORIZADO, {error: "Invalid user or does not exists!"});
  }

  request.user = user;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userExists = users.find(user => user.username == username);
  if (userExists) {
    return returnResponse(response, HTTP_CODIGO_REQUISICAO_INVALIDA, {error: "User name already exists!"});
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  };

  users.push(user);
  return returnResponse(response, HTTP_CODIGO_CRIADO, user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return returnResponse(response, HTTP_CODIGO_SUCESSO, user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todo);
  return returnResponse(response, HTTP_CODIGO_CRIADO, todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const { id } = request.params;

  const todo = user.todos.find(todo => todo.id == id);

  if (!todo) {
    return returnResponse(response, HTTP_CODIGO_NAO_EXISTE, {error: "Todo does not exists!"});
  }

  todo.title = title;
  todo.deadline = new Date(deadline);

  return returnResponse(response, HTTP_CODIGO_SUCESSO, todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todo = user.todos.find(todo => todo.id == id);

  if (!todo) {
    return returnResponse(response, HTTP_CODIGO_NAO_EXISTE, {error: "Todo does not exists!"});
  }

  todo.done = true;

  return returnResponse(response, HTTP_CODIGO_SUCESSO, todo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todoExists = user.todos.findIndex(todo => todo.id == id);

  if (todoExists === -1) {
    return returnResponse(response, HTTP_CODIGO_NAO_EXISTE, {error: "Todo does not exists!"});
  }

  user.todos.splice(todoExists, 1);

  return returnResponse(response, HTTP_CODIGO_SEM_CONTEUDO, "");
});

module.exports = app;
