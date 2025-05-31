'use client';

import { Layout } from '@/components/layout/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { ImageIcon, CalendarIcon } from '@radix-ui/react-icons';

export default function Home() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Manage your scheduled events and uploads</p>
        </div>

        <div className="flex gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button className="bg-primary hover:bg-primary-hover">
              <ImageIcon className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="outline" className="border-accent hover:bg-accent/20">
              <CalendarIcon className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          </motion.div>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="bg-accent/20">
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="recent">Recent Uploads</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4">
            <div className="grid gap-4">
              <Card className="p-4 bg-background-hover border-accent/20">
                <h3 className="font-medium mb-1">Flight to New York</h3>
                <p className="text-sm text-gray-400">Tomorrow at 10:30 AM</p>
              </Card>
              <Card className="p-4 bg-background-hover border-accent/20">
                <h3 className="font-medium mb-1">Doctor Appointment</h3>
                <p className="text-sm text-gray-400">Friday at 2:00 PM</p>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="recent" className="mt-4">
            <div className="grid gap-4">
              <Card className="p-4 bg-background-hover border-accent/20">
                <h3 className="font-medium mb-1">Concert Ticket</h3>
                <p className="text-sm text-gray-400">Uploaded 2 hours ago</p>
              </Card>
              <Card className="p-4 bg-background-hover border-accent/20">
                <h3 className="font-medium mb-1">Meeting Confirmation</h3>
                <p className="text-sm text-gray-400">Uploaded yesterday</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
