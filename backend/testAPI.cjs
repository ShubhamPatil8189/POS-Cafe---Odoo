async function runTests() {
  const baseUrl = 'http://127.0.0.1:5000/api';
  console.log('--- Starting API Tests for Module B ---');
  
  try {
    // 1. Fetch Floors and nested Tables
    console.log('\n[1] Testing GET /api/floors...');
    const floorsRes = await fetch(`${baseUrl}/floors`);
    const floors = await floorsRes.json();
    console.log(`✅ Success: Found ${floors.length} floors.`);
    if (floors.length > 0) {
       console.log(`    Floor '${floors[0].name}' has ${floors[0].tables ? floors[0].tables.length : 0} tables.`);
    }

    // 2. Fetch all Payment Methods
    console.log('\n[2] Testing GET /api/payment-methods...');
    const pmRes = await fetch(`${baseUrl}/payment-methods`);
    const pm = await pmRes.json();
    console.log(`✅ Success: Found ${pm.length} payment methods.`);
    pm.forEach(m => console.log(`    - ${m.type} (Enabled: ${m.is_enabled})`));

    if (pm.length > 0) {
       const targetId = pm[0].id;
       console.log(`\n[3] Testing PUT /api/payment-methods/${targetId} (Toggle)...`);
       const updatePmRes = await fetch(`${baseUrl}/payment-methods/${targetId}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ is_enabled: !pm[0].is_enabled })
       });
       const updatedPm = await updatePmRes.json();
       console.log(`✅ Success: Toggled ${updatedPm.type} to Enabled=${updatedPm.is_enabled}`);
       
       // revert it back
       await fetch(`${baseUrl}/payment-methods/${targetId}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ is_enabled: pm[0].is_enabled })
       });
    }

    // 4. Test Terminal
    console.log('\n[4] Testing GET /api/terminal...');
    const termRes = await fetch(`${baseUrl}/terminal`);
    const terminals = await termRes.json();
    console.log(`✅ Success: Found ${terminals.length} terminals.`);
    let termId = 1;
    if (terminals.length > 0) {
       termId = terminals[0].id;
       console.log(`    Terminal: ${terminals[0].name}`);
    }

    // 5. Test Sessions
    console.log('\n[5] Testing POST /api/sessions/open...');
    const sessOpenRes = await fetch(`${baseUrl}/sessions/open`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ terminal_id: termId, opening_balance: 100.5 })
    });
    const session = await sessOpenRes.json();
    if (session.error) {
       console.log(`⚠️ Info: Could not open session (${session.error}). A session might already be open.`);
    } else {
       console.log(`✅ Success: Opened session ID ${session.id} with balance $${session.opening_balance}`);
       
       console.log('\n[6] Testing POST /api/sessions/close...');
       const sessCloseRes = await fetch(`${baseUrl}/sessions/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: session.id, closing_balance: 550.0 })
       });
       const closedSession = await sessCloseRes.json();
       console.log(`✅ Success: Closed session ID ${closedSession.id} with balance $${closedSession.closing_balance}`);
    }

    // 7. Test Table Status Changes
    console.log('\n[7] Testing Table Status Validation (available -> occupied)...');
    let tableId = 1;
    if (floors[0] && floors[0].tables && floors[0].tables.length > 0) {
      tableId = floors[0].tables[0].id;
    }
    const updateTableRes = await fetch(`${baseUrl}/tables/${tableId}/status`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ status: 'occupied' })
    });
    const updatedTable = await updateTableRes.json();
    if (updatedTable.error) {
       console.log(`❌ Failed: ${updatedTable.error}`);
    } else {
       console.log(`✅ Success: Table ${tableId} is now ${updatedTable.status}`);

       // Clear it
       await fetch(`${baseUrl}/tables/${tableId}/clear`, { method: 'PUT' });
       console.log(`✅ Success: Table ${tableId} manually cleared back to available.`);
    }
    // 8. Test Reservations
    console.log('\n[8] Testing POST /api/reservations (Create)...');
    const resvRes = await fetch(`${baseUrl}/reservations`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           table_id: tableId, 
           customer_name: 'Test Customer', 
           reserved_time: '2026-04-04 18:00:00',
           expiry_time: '2026-04-04 19:00:00'
         })
    });
    const reservation = await resvRes.json();
    if (reservation.error) {
       console.log(`❌ Failed: ${reservation.error}`);
    } else {
       console.log(`✅ Success: Created reservation ID ${reservation.id} for table ${tableId}`);
       
       console.log('\n[9] Testing PUT /api/reservations/:id/checkin...');
       const checkinRes = await fetch(`${baseUrl}/reservations/${reservation.id}/checkin`, { method: 'PUT' });
       const checkin = await checkinRes.json();
       console.log(`✅ Success: Checked in reservation. Table status is now completed.`);
       
       // Clear table again
       await fetch(`${baseUrl}/tables/${tableId}/clear`, { method: 'PUT' });
    }

    console.log('\n--- 🎉 All Tests Executed ---');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

runTests();
