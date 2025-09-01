import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, CheckSquare, Clock, Calendar, User, Building2, HandHeart } from 'lucide-react';
import type { Task, CreateTaskInput, UpdateTaskInput, Contact, Company, Deal } from '../../../server/src/schema';

export function TasksSection() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [createForm, setCreateForm] = useState<CreateTaskInput>({
    title: '',
    description: null,
    completed: false,
    due_date: null,
    contact_id: null,
    company_id: null,
    deal_id: null
  });

  const [editForm, setEditForm] = useState<Partial<UpdateTaskInput>>({
    title: '',
    description: null,
    completed: false,
    due_date: null,
    contact_id: null,
    company_id: null,
    deal_id: null
  });

  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const result = await trpc.getContacts.query();
      setContacts(result);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const result = await trpc.getCompanies.query();
      setCompanies(result);
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  }, []);

  const loadDeals = useCallback(async () => {
    try {
      const result = await trpc.getDeals.query();
      setDeals(result);
    } catch (error) {
      console.error('Failed to load deals:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadContacts();
    loadCompanies();
    loadDeals();
  }, [loadTasks, loadContacts, loadCompanies, loadDeals]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newTask = await trpc.createTask.mutate(createForm);
      setTasks((prev: Task[]) => [...prev, newTask]);
      setCreateForm({
        title: '',
        description: null,
        completed: false,
        due_date: null,
        contact_id: null,
        company_id: null,
        deal_id: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setIsLoading(true);
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: editingTask.id,
        ...editForm
      });
      setTasks((prev: Task[]) =>
        prev.map((task: Task) => (task.id === editingTask.id ? updatedTask : task))
      );
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: task.id,
        completed: !task.completed
      });
      setTasks((prev: Task[]) =>
        prev.map((t: Task) => (t.id === task.id ? updatedTask : t))
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description,
      completed: task.completed,
      due_date: task.due_date,
      contact_id: task.contact_id,
      company_id: task.company_id,
      deal_id: task.deal_id
    });
  };

  const getContactName = (contactId: number | null) => {
    if (!contactId) return null;
    const contact = contacts.find((c: Contact) => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : null;
  };

  const getCompanyName = (companyId: number | null) => {
    if (!companyId) return null;
    const company = companies.find((c: Company) => c.id === companyId);
    return company?.name || null;
  };

  const getDealTitle = (dealId: number | null) => {
    if (!dealId) return null;
    const deal = deals.find((d: Deal) => d.id === dealId);
    return deal?.title || null;
  };

  const formatDate = (date: Date | null) => {
    return date ? date.toLocaleDateString() : null;
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.completed) return false;
    return new Date(task.due_date) < new Date();
  };

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const overdueTasks = tasks.filter(task => isOverdue(task));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-indigo-600" />
            Tasks & Activities
          </h2>
          <p className="text-gray-600">Manage your follow-ups and activities</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={createForm.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateForm((prev: CreateTaskInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={createForm.due_date?.toISOString().split('T')[0] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateTaskInput) => ({
                      ...prev,
                      due_date: e.target.value ? new Date(e.target.value) : null
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="contact">Related Contact</Label>
                <Select
                  value={createForm.contact_id?.toString() || 'none'}
                  onValueChange={(value: string) =>
                    setCreateForm((prev: CreateTaskInput) => ({
                      ...prev,
                      contact_id: value === 'none' ? null : parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Contact</SelectItem>
                    {contacts.map((contact: Contact) => (
                      <SelectItem key={contact.id} value={contact.id.toString()}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="company">Related Company</Label>
                <Select
                  value={createForm.company_id?.toString() || 'none'}
                  onValueChange={(value: string) =>
                    setCreateForm((prev: CreateTaskInput) => ({
                      ...prev,
                      company_id: value === 'none' ? null : parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Company</SelectItem>
                    {companies.map((company: Company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deal">Related Deal</Label>
                <Select
                  value={createForm.deal_id?.toString() || 'none'}
                  onValueChange={(value: string) =>
                    setCreateForm((prev: CreateTaskInput) => ({
                      ...prev,
                      deal_id: value === 'none' ? null : parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a deal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Deal</SelectItem>
                    {deals.map((deal: Deal) => (
                      <SelectItem key={deal.id} value={deal.id.toString()}>
                        {deal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-xl font-bold">{tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">{pendingTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold">{completedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-xl font-bold text-red-600">{overdueTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              No tasks yet. Create your first task to start tracking activities!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task: Task) => (
            <Card key={task.id} className={`hover:shadow-lg transition-shadow ${
              task.completed ? 'bg-gray-50 border-gray-200' : isOverdue(task) ? 'border-red-200 bg-red-50' : ''
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleToggleComplete(task)}
                    />
                    <span className={`truncate ${task.completed ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Task</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{task.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(task.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={task.completed ? 'secondary' : isOverdue(task) ? 'destructive' : 'default'}>
                    {task.completed ? '✅ Completed' : isOverdue(task) ? '🔴 Overdue' : '⏳ Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {task.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Due: {formatDate(task.due_date)}
                  </div>
                )}
                {getContactName(task.contact_id) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    {getContactName(task.contact_id)}
                  </div>
                )}
                {getCompanyName(task.company_id) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    {getCompanyName(task.company_id)}
                  </div>
                )}
                {getDealTitle(task.deal_id) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <HandHeart className="h-4 w-4" />
                    {getDealTitle(task.deal_id)}
                  </div>
                )}
                <div className="pt-2 text-xs text-gray-400">
                  Created: {task.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Task Title *</Label>
                <Input
                  id="edit-title"
                  value={editForm.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditForm((prev) => ({ ...prev, description: e.target.value || null }))
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-completed"
                  checked={editForm.completed || false}
                  onCheckedChange={(checked: boolean) =>
                    setEditForm((prev) => ({ ...prev, completed: checked }))
                  }
                />
                <Label htmlFor="edit-completed">Mark as completed</Label>
              </div>
              <div>
                <Label htmlFor="edit-due-date">Due Date</Label>
                <Input
                  id="edit-due-date"
                  type="date"
                  value={editForm.due_date?.toISOString().split('T')[0] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev) => ({
                      ...prev,
                      due_date: e.target.value ? new Date(e.target.value) : null
                    }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}