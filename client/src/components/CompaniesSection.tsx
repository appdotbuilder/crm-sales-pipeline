import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, Building2, Globe, Phone, Mail, MapPin } from 'lucide-react';
import type { Company, CreateCompanyInput, UpdateCompanyInput } from '../../../server/src/schema';

export function CompaniesSection() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [createForm, setCreateForm] = useState<CreateCompanyInput>({
    name: '',
    industry: null,
    website: null,
    phone: null,
    email: null,
    address: null
  });

  const [editForm, setEditForm] = useState<Partial<UpdateCompanyInput>>({
    name: '',
    industry: null,
    website: null,
    phone: null,
    email: null,
    address: null
  });

  const loadCompanies = useCallback(async () => {
    try {
      const result = await trpc.getCompanies.query();
      setCompanies(result);
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCompany = await trpc.createCompany.mutate(createForm);
      setCompanies((prev: Company[]) => [...prev, newCompany]);
      setCreateForm({
        name: '',
        industry: null,
        website: null,
        phone: null,
        email: null,
        address: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    setIsLoading(true);
    try {
      const updatedCompany = await trpc.updateCompany.mutate({
        id: editingCompany.id,
        ...editForm
      });
      setCompanies((prev: Company[]) =>
        prev.map((company: Company) => (company.id === editingCompany.id ? updatedCompany : company))
      );
      setEditingCompany(null);
    } catch (error) {
      console.error('Failed to update company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (companyId: number) => {
    try {
      await trpc.deleteCompany.mutate({ id: companyId });
      setCompanies((prev: Company[]) => prev.filter((company: Company) => company.id !== companyId));
    } catch (error) {
      console.error('Failed to delete company:', error);
    }
  };

  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
    setEditForm({
      name: company.name,
      industry: company.industry,
      website: company.website,
      phone: company.phone,
      email: company.email,
      address: company.address
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Companies
          </h2>
          <p className="text-gray-600">Manage your business relationships</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateCompanyInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={createForm.industry || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateCompanyInput) => ({
                      ...prev,
                      industry: e.target.value || null
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={createForm.website || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateCompanyInput) => ({
                      ...prev,
                      website: e.target.value || null
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
                    setCreateForm((prev: CreateCompanyInput) => ({
                      ...prev,
                      phone: e.target.value || null
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateCompanyInput) => ({
                      ...prev,
                      email: e.target.value || null
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={createForm.address || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateForm((prev: CreateCompanyInput) => ({
                      ...prev,
                      address: e.target.value || null
                    }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Company'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              No companies yet. Create your first company to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company: Company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{company.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(company)}>
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
                          <AlertDialogTitle>Delete Company</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {company.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(company.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardTitle>
                {company.industry && (
                  <Badge variant="secondary" className="w-fit">
                    {company.industry}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {company.website && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="h-4 w-4" />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {company.website}
                    </a>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {company.phone}
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${company.email}`} className="hover:underline">
                      {company.email}
                    </a>
                  </div>
                )}
                {company.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span className="line-clamp-2">{company.address}</span>
                  </div>
                )}
                <div className="pt-2 text-xs text-gray-400">
                  Created: {company.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingCompany && (
        <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Company Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-industry">Industry</Label>
                <Input
                  id="edit-industry"
                  value={editForm.industry || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev) => ({ ...prev, industry: e.target.value || null }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  type="url"
                  value={editForm.website || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev) => ({ ...prev, website: e.target.value || null }))
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
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={editForm.address || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditForm((prev) => ({ ...prev, address: e.target.value || null }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingCompany(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Company'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}