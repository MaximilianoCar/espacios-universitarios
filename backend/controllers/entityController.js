const { Entity } = require('../models');

exports.createEntity = async (req, res) => {
  try {
    const { name, email } = req.body;
    const entity = await Entity.create({ name, email });
    res.status(201).json(entity);
  } catch (error) {
    console.error('Error creating entity:', error);
    res.status(500).json({ error: 'Error creating entity.' });
  }
};

exports.getEntities = async (req, res) => {
  try {
    const entities = await Entity.findAll({ order: [['name', 'ASC']] });
    res.status(200).json(entities);
  } catch (error) {
    console.error('Error fetching entities:', error);
    res.status(500).json({ error: 'Error fetching entities.' });
  }
};

exports.getEntityById = async (req, res) => {
  try {
    const entity = await Entity.findByPk(req.params.id);
    if (!entity) return res.status(404).json({ error: 'Entity not found.' });
    res.status(200).json(entity);
  } catch (error) {
    console.error('Error fetching entity:', error);
    res.status(500).json({ error: 'Error fetching entity.' });
  }
};

exports.updateEntity = async (req, res) => {
  try {
    const entity = await Entity.findByPk(req.params.id);
    if (!entity) return res.status(404).json({ error: 'Entity not found.' });
    const { name, email } = req.body;
    await entity.update({ name, email });
    res.status(200).json(entity);
  } catch (error) {
    console.error('Error updating entity:', error);
    res.status(500).json({ error: 'Error updating entity.' });
  }
};

exports.deleteEntity = async (req, res) => {
  try {
    const entity = await Entity.findByPk(req.params.id);
    if (!entity) return res.status(404).json({ error: 'Entity not found.' });
    await entity.destroy();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting entity:', error);
    res.status(500).json({ error: 'Error deleting entity.' });
  }
};
