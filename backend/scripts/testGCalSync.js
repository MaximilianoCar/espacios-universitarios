const fetch = global.fetch || require('node-fetch');
const { User } = require('../models');

const BASE = 'http://localhost:3000/api';
const testEmail = 'testgcal@example.com';
const testPassword = 'Pass12345!';

(async () => {
  try {
    console.log('Ensuring requester user exists...');
    let user = await User.findOne({ where: { email: testEmail } });
    if (!user) {
      user = await User.createRequester({
        name: 'Test GCal User',
        email: testEmail,
        password: testPassword,
      });
      console.log('User created:', user.email, 'role:', user.role);
    } else {
      if (user.role !== 'requester') {
        user.role = 'requester';
        await user.save();
        console.log('User promoted to requester');
      } else {
        console.log('User already requester');
      }
    }

    // Login
    console.log('Logging in...');
    const loginRes = await fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed', loginJson);
      process.exit(1);
    }
    const token = loginJson.data.token;
    console.log('Got token');

    // Create event
    console.log('Creating event...');
    const createRes = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: `Test Event ${Date.now()}`,
        description: 'Evento de prueba para sincronizacion GCal',
        capacity: 10,
        cost: '0',
        contact: 'test',
      }),
    });
    const created = await createRes.json();
    if (!createRes.ok) {
      console.error('Create event failed', created);
      process.exit(1);
    }
    console.log(
      'Event created:',
      created.id,
      'googleEventId:',
      created.googleEventId
    );

    // Update event
    console.log('Updating event name...');
    const updateRes = await fetch(`${BASE}/events/${created.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: `${created.name} (updated)` }),
    });
    const updated = await updateRes.json();
    if (!updateRes.ok) {
      console.error('Update failed', updated);
    } else {
      console.log('Event updated:', updated.id);
    }

    // Delete event
    console.log('Deleting event...');
    const delRes = await fetch(`${BASE}/events/${created.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (delRes.status === 204) {
      console.log('Event deleted');
    } else {
      const delJson = await delRes.json();
      console.error('Delete failed', delJson);
    }

    console.log('Test sequence finished');
    process.exit(0);
  } catch (err) {
    console.error('Test script error:', err);
    process.exit(1);
  }
})();
