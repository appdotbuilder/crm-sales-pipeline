import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, User, Phone, Mail, Building2, Briefcase } from 'lucide-react';
import type { Contact, CreateContactInput, UpdateContactInput, Company } from '../../../server/src/schema';

export function ContactsSection() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [createForm, setCreateForm] = useState<CreateContactInput>({
    first_name: '',
    last_name: '',
    email: null,
    phone: null,
    job_title: null,
    company_id: null
  });

  const [editForm, setEditForm] = useState<Partial<UpdateContactInput>>({
    first_name: '',
    last_name: '',
    email: null,
    phone: null,
    job_title: null,
    company_id: null
  });

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

  useEffect(() => {
    loadContacts();
    loadCompanies();
  }, [loadContacts, loadCompanies]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newContact = await trpc.createContact.mutate(createForm);
      setContacts((prev: Contact[]) => [...prev, newContact]);
      setCreateForm({
        first_name: '',
        last_name: '',
        email: null,
        phone: null,
        job_title: null,
        company_id: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    setIsLoading(true);
    try {
      const updatedContact = await trpc.updateContact.mutate({
        id: editingContact.id,
        ...editForm
      });
      setContacts((prev: Contact[]) =>
        prev.map((contact: Contact) => (contact.id === editingContact.id ? updatedContact : contact))
      );
      setEditingContact(null);
    } catch (error) {
      console.error('Failed to update contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (contactId: number) => {
    try {
      await trpc.deleteContact.mutate({ id: contactId });
      setContacts((prev: Contact[]) => prev.filter((contact: Contact) => contact.id !== contactId));
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact);
    setEditForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      job_title: contact.job_title,
      company_id: contact.company_id
    });
  };

  const getCompanyName = (companyId: number | null) => {
    if (!companyId) return null;
    const company = companies.find((c: Company) => c.id === companyId);
    return company?.name || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="h-6 w-6 text-green-600" />
            Contacts
          </h2>
          <p className="text-gray-600">Manage your individual contacts</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Contact</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={createForm.first_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateForm((prev: CreateContactInput) => ({ ...prev, first_name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={createForm.last_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateForm((prev: CreateContactInput) => ({ ...prev, last_name: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateContactInput) => ({
                      ...prev,
                      email: e.target.value || null
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={createForm.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateContactInput) => ({
                      ...prev,
                      phone: e.target.value || null
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={createForm.job_title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateContactInput) => ({
                      ...prev,
                      job_title: e.target.value || null
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Select
                  value={createForm.company_id?.toString() || 'none'}
                  onValueChange={(value: string) =>
                    setCreateForm((prev: CreateContactInput) => ({
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
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Contact'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              No contacts yet. Add your first contact to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact: Contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">
                    {contact.first_name} {contact.last_name}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(contact)}>
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
                          <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {contact.first_name} {contact.last_name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(contact.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardTitle>
                {contact.job_title && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="h-4 w-4" />
                    {contact.job_title}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {getCompanyName(contact.company_id) && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <Badge variant="outline">
                      {getCompanyName(contact.company_id)}
                    </Badge>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${contact.email}`} className="hover:underline">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${contact.phone}`} className="hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                )}
                <div className="pt-2 text-xs text-gray-400">
                  Created: {contact.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingContact && (
        <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-first-name">First Name *</Label>
                  <Input
                    id="edit-first-name"
                    value={editForm.first_name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditForm((prev) => ({ ...prev, first_name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-last-name">Last Name *</Label>
                  <Input
                    id="edit-last-name"
                    value={editForm.last_name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditForm((prev) => ({ ...prev, last_name: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value || null }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev) => ({ ...prev, phone: e.target.value || null }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-job-title">Job Title</Label>
                <Input
                  id="edit-job-title"
                  value={editForm.job_title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev) => ({ ...prev, job_title: e.target.value || null }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-company">Company</Label>
                <Select
                  value={editForm.company_id?.toString() || 'none'}
                  onValueChange={(value: string) =>
                    setEditForm((prev) => ({
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
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingContact(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Contact'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}