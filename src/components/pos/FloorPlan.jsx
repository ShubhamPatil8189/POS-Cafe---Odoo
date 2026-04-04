import React, { useState, useEffect } from 'react';
import { Badge, Card, CardHeader, CardTitle, CardContent, Button } from '../ui';
import { Users, Clock, Lock } from 'lucide-react';
import API_BASE_URL from '../../config';

export default function FloorPlan() {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFloors = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/floors`);
        const data = await res.json();
        setFloors(data);
      } catch (err) {
        console.error('Floor plan fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFloors();
  }, []);

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading floor plan...</div>;

  return (
    <div className="space-y-8 animate-slide-up">
      {floors.map(floor => (
        <div key={floor.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-text-primary">{floor.name}</h3>
            <Badge variant="primary">{floor.tables?.length || 0} Tables</Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(floor.tables || []).map(table => (
              <Card 
                key={table.id} 
                className={`transition-all duration-300 hover:shadow-lg ${
                  table.status === 'occupied' ? 'border-primary-300 bg-primary-50/30' : 
                  table.status === 'reserved' ? 'border-accent-300 bg-accent-50/30' : ''
                }`}
              >
                <div className="flex flex-col items-center p-2">
                   <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm border border-border mb-3 font-bold text-lg text-primary-700">
                     {table.table_number}
                   </div>
                   
                   <div className="text-center space-y-1">
                      <p className="text-xs font-semibold text-text-primary">{table.seats} Seats</p>
                      <Badge 
                        variant={table.status === 'available' ? 'success' : table.status === 'occupied' ? 'primary' : 'warning'} 
                        size="xs" 
                        dot
                      >
                        {table.status}
                      </Badge>
                   </div>
                   
                   {table.status === 'available' && (
                     <Button size="xs" variant="outline" className="mt-4 w-full">Quick Start</Button>
                   )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
