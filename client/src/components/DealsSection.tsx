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
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, HandHeart, DollarSign, User, Building2, Calendar, TrendingUp } from 'lucide-react';
import type { Deal, CreateDealInput, UpdateDealInput, Contact, Company, DealStage } from '../../../server/src/schema';

const DEAL_STAGE_COLORS: Record<DealStage, string> = {
  'New Lead': 'bg-gray-100 text-gray-800',
  'Qualified': 'bg-blue-100 text-blue-800',
  'Proposal Sent': 'bg-yellow-100 text-yellow-800',
  'Negotiation': 'bg-orange-100 text-orange-800',
  'Won': 'bg-green-100 text-green-800',
  'Lost': 'bg-red-100 text-red-800'
};

const DEAL_STAGE_ICONS: Record<DealStage, string> = {
  'New Lead': '🆕',
  'Qualified': '✅',
  'Proposal Sent': '📝',
  'Negotiation': '🤝',
  'Won': '🎉',
  'Lost': '❌'
};

export function DealsSection() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const [createForm, setCreateForm] = useState<CreateDealInput>({
    title: '',
    description: null,
    value: 0,
    stage: 'New Lead',
    contact_id: 0,
    company_id: 0,
    expected_close_date: null
  });

  const [editForm, setEditForm] = useState<Partial<UpdateDealInput>>({
    title: '',
    description: null,
    value: 0,
    stage: 'New Lead',
    contact_id: 0,
    company_id: 0,
    expected_close_date: null
  });

  const loadDeals = useCallback(async () => {
    try {
      const result = await trpc.getDeals.query();
      setDeals(result);
    } catch (error) {
      console.error('Failed to load deals:', error);
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

  useEffect(() => {
    loadDeals();
    loadContacts();
    loadCompanies();
  }, [loadDeals, loadContacts, loadCompanies]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newDeal = await trpc.createDeal.mutate(createForm);
      setDeals((prev: Deal[]) => [...prev, newDeal]);
      setCreateForm({
        title: '',
        description: null,
        value: 0,
        stage: 'New Lead',
        contact_id: 0,
        company_id: 0,
        expected_close_date: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create deal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;

    setIsLoading(true);
    try {
      const updatedDeal = await trpc.updateDeal.mutate({
        id: editingDeal.id,
        ...editForm
      });
      setDeals((prev: Deal[]) =>
        prev.map((deal: Deal) => (deal.id === editingDeal.id ? updatedDeal : deal))
      );
      setEditingDeal(null);
    } catch (error) {
      console.error('Failed to update deal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (dealId: number) => {
    try {
      await trpc.deleteDeal.mutate({ id: dealId });
      setDeals((prev: Deal[]) => prev.filter((deal: Deal) => deal.id !== dealId));
    } catch (error) {
      console.error('Failed to delete deal:', error);
    }
  };

  const openEditDialog = (deal: Deal) => {
    setEditingDeal(deal);
    setEditForm({
      title: deal.title,
      description: deal.description,
      value: deal.value,
      stage: deal.stage,
      contact_id: deal.contact_id,
      company_id: deal.company_id,
      expected_close_date: deal.expected_close_date
    });
  };

  const getContactName = (contactId: number) => {
    const contact = contacts.find((c: Contact) => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact';
  };

  const getCompanyName = (companyId: number) => {
    const company = companies.find((c: Company) => c.id === companyId);
    return company?.name || 'Unknown Company';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    return date ? date.toLocaleDateString() : 'Not set';
  };

  const totalDealValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const wonDeals = deals.filter(deal => deal.stage === 'Won');
  const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HandHeart className="h-6 w-6 text-purple-600" />
            Sales Pipeline
          </h2>
          <p className="text-gray-600">Track your sales opportunities</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Deal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Deal Title *</Label>
                <Input
                  id="title"
                  value={createForm.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateDealInput) => ({ ...prev, title: e.target.value }))
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
                    setCreateForm((prev: CreateDealInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="value">Deal Value *</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateDealInput) => ({ 
                      ...prev, 
                      value: parseFloat(e.target.value) || 0 
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={createForm.stage}
                  onValueChange={(value: DealStage) =>
                    setCreateForm((prev: CreateDealInput) => ({ ...prev, stage: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Lead">🆕 New Lead</SelectItem>
                    <SelectItem value="Qualified">✅ Qualified</SelectItem>
                    <SelectItem value="Proposal Sent">📝 Proposal Sent</SelectItem>
                    <SelectItem value="Negotiation">🤝 Negotiation</SelectItem>
                    <SelectItem value="Won">🎉 Won</SelectItem>
                    <SelectItem value="Lost">❌ Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contact">Contact *</Label>
                <Select
                  value={createForm.contact_id.toString()}
                  onValueChange={(value: string) =>
                    setCreateForm((prev: CreateDealInput) => ({ 
                      ...prev, 
                      contact_id: parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact: Contact) => (
                      <SelectItem key={contact.id} value={contact.id.toString()}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="company">Company *</Label>
                <Select
                  value={createForm.company_id.toString()}
                  onValueChange={(value: string) =>
                    setCreateForm((prev: CreateDealInput) => ({ 
                      ...prev, 
                      company_id: parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company: Company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expected_close_date">Expected Close Date</Label>
                <Input
                  id="expected_close_date"
                  type="date"
                  value={createForm.expected_close_date?.toISOString().split('T')[0] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateDealInput) => ({
                      ...prev,
                      expected_close_date: e.target.value ? new Date(e.target.value) : null
                    }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Deal'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Pipeline</p>
                <p className="text-xl font-bold">{formatCurrency(totalDealValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <HandHeart className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Won Deals</p>
                <p className="text-xl font-bold">{wonDeals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Won Value</p>
                <p className="text-xl font-bold">{formatCurrency(wonValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {deals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HandHeart className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              No deals yet. Create your first deal to start tracking opportunities!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal: Deal) => (
            <Card key={deal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{deal.title}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(deal)}>
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
                          <AlertDialogTitle>Delete Deal</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{deal.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(deal.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardTitle>
                <div className="flex items-center justify-between">
                  <Badge className={DEAL_STAGE_COLORS[deal.stage]}>
                    {DEAL_STAGE_ICONS[deal.stage]} {deal.stage}
                  </Badge>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(deal.value)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {deal.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{deal.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  {getContactName(deal.contact_id)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  {getCompanyName(deal.company_id)}
                </div>
                {deal.expected_close_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Expected: {formatDate(deal.expected_close_date)}
                  </div>
                )}
                <div className="pt-2 text-xs text-gray-400">
                  Created: {deal.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingDeal && (
        <Dialog open={!!editingDeal} onOpenChange={() => setEditingDeal(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Deal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Deal Title *</Label>
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
              <div>
                <Label htmlFor="edit-value">Deal Value *</Label>
                <Input
                  id="edit-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.value || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-stage">Stage</Label>
                <Select
                  value={editForm.stage || 'New Lead'}
                  onValueChange={(value: DealStage) =>
                    setEditForm((prev) => ({ ...prev, stage: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Lead">🆕 New Lead</SelectItem>
                    <SelectItem value="Qualified">✅ Qualified</SelectItem>
                    <SelectItem value="Proposal Sent">📝 Proposal Sent</SelectItem>
                    <SelectItem value="Negotiation">🤝 Negotiation</SelectItem>
                    <SelectItem value="Won">🎉 Won</SelectItem>
                    <SelectItem value="Lost">❌ Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-expected-close">Expected Close Date</Label>
                <Input
                  id="edit-expected-close"
                  type="date"
                  value={editForm.expected_close_date?.toISOString().split('T')[0] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev) => ({
                      ...prev,
                      expected_close_date: e.target.value ? new Date(e.target.value) : null
                    }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingDeal(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Deal'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}