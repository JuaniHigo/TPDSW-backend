// controllers/usuariosController.js

const {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario
} = require('../models/usuario');

const { v4: uuidv4 } = require('uuid');

function crear(req, res) {
  const { nombre, correo } = req.body;

  if (!nombre || !correo) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
  }

  const nuevoUsuario = {
    id: uuidv4(),
    nombre,
    correo
  };

  crearUsuario(nuevoUsuario);
  res.status(201).json(nuevoUsuario);
}

function listar(req, res) {
  const usuarios = obtenerUsuarios();
  res.json(usuarios);
}

function obtenerPorId(req, res) {
  const { id } = req.params;
  const usuario = obtenerUsuarioPorId(id);

  if (!usuario) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  }

  res.json(usuario);
}

function actualizar(req, res) {
  const { id } = req.params;
  const nuevosDatos = req.body;

  const usuarioActualizado = actualizarUsuario(id, nuevosDatos);

  if (!usuarioActualizado) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  }

  res.json(usuarioActualizado);
}

function eliminar(req, res) {
  const { id } = req.params;

  const usuarioEliminado = eliminarUsuario(id);

  if (!usuarioEliminado) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  }

  res.json({ mensaje: 'Usuario eliminado correctamente' });
}

module.exports = {
  crear,
  listar,
  obtenerPorId,
  actualizar,
  eliminar
};
