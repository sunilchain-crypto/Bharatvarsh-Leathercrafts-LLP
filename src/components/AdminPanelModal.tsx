import React, { useState } from 'react';
import { CategoryStructure, Product, TopCategory, Coupon } from '../types';
import { catalogService } from '../services/catalogService';
import { couponService } from '../services/couponService';
import { aiService, GeneratedStoryResult } from '../services/aiService';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Copy,
  HelpCircle,
  FolderTree,
  Tag,
  PackageCheck,
  Ticket,
  Percent,
  Calendar,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Wand2,
  Check,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  FileText,
  Database,
  HardDrive,
  Mail,
  Inbox,
  Send,
  ImageIcon,
  Server,
  Lock,
  ShieldAlert,
  Zap,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: CategoryStructure[];
  onCatalogChanged: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  onCatalogChanged
}) => {
  const { isOwner, role, user, getAuthHeaders } = useAuth();

  if (!isOpen) return null;

  if (!isOwner) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-stone-900 border border-red-900/60 rounded-2xl shadow-2xl overflow-hidden p-8 text-center text-stone-200 animate-fadeIn">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-300 bg-red-950/80 border border-red-800/80 rounded-full mb-3">
            HTTP 403 Forbidden
          </span>

          <h3 className="font-serif text-2xl font-bold text-amber-100 mb-2">
            Store Management Restricted
          </h3>
          
          <p className="text-sm text-stone-300 mb-6 leading-relaxed">
            Role-Based Access Control is enforced. Store Management (Product Catalog, Categories, Inventory, Database, and Server Settings) is accessible only to the authenticated <strong>Store Owner</strong>.
          </p>

          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 mb-6 text-left text-xs space-y-2">
            <div className="flex justify-between items-center text-stone-400">
              <span>Current Account:</span>
              <span className="font-mono text-stone-200">{user?.email || 'Guest / Not Authenticated'}</span>
            </div>
            <div className="flex justify-between items-center text-stone-400">
              <span>Assigned Role:</span>
              <span className="font-semibold text-amber-400">{role}</span>
            </div>
            <div className="flex justify-between items-center text-stone-400">
              <span>Designated Owner:</span>
              <span className="font-mono text-amber-200">sunilchain@gmail.com</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-xl font-medium text-sm transition-colors shadow"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'coupons' | 'concierge' | 'json' | 'server' | 'guide'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Concierge AI Knowledge Base State
  const [conciergeKnowledge, setConciergeKnowledge] = useState<string>('');
  const [knowledgeLastModified, setKnowledgeLastModified] = useState<string>('');
  const [isSavingKnowledge, setIsSavingKnowledge] = useState(false);
  const [testPrompt, setTestPrompt] = useState<string>('What size belt should I order for a 34 waist?');
  const [testResponse, setTestResponse] = useState<string>('');
  const [isTestingPrompt, setIsTestingPrompt] = useState(false);

  const fetchConciergeKnowledge = async () => {
    try {
      const res = await fetch('/api/concierge-knowledge');
      const data = await res.json();
      if (data && data.content) {
        setConciergeKnowledge(data.content);
        setKnowledgeLastModified(data.lastModified || '');
      }
    } catch (e) {
      console.warn('Failed loading concierge knowledge:', e);
    }
  };

  const handleSaveKnowledge = async () => {
    setIsSavingKnowledge(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/admin/concierge-knowledge', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({ content: conciergeKnowledge })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ text: '✓ Concierge AI knowledge base updated & applied instantly', type: 'success' });
        setKnowledgeLastModified(data.lastModified || new Date().toISOString());
      } else {
        setStatusMessage({ text: `Failed: ${data.error || 'Could not save'}`, type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: `Error: ${err.message}`, type: 'error' });
    } finally {
      setIsSavingKnowledge(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleTestConciergePrompt = async () => {
    if (!testPrompt.trim() || isTestingPrompt) return;
    setIsTestingPrompt(true);
    setTestResponse('');
    try {
      const res = await fetch('/api/gemini/concierge-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testPrompt })
      });
      const data = await res.json();
      setTestResponse(data.reply || 'No response returned.');
    } catch (e: any) {
      setTestResponse(`Error: ${e.message}`);
    } finally {
      setIsTestingPrompt(false);
    }
  };

  // Hostinger Server, MySQL & Media Storage State
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);

  // IMAP Inbox & Test State
  const [imapMessages, setImapMessages] = useState<any[]>([]);
  const [isLoadingImap, setIsLoadingImap] = useState(false);
  const [isTestingImap, setIsTestingImap] = useState(false);
  const [imapTestResult, setImapTestResult] = useState<any>(null);
  const [selectedMail, setSelectedMail] = useState<any>(null);

  // CRM Webhook Dispatcher State
  const [webhookStatus, setWebhookStatus] = useState<any>(null);
  const [webhookDeliveries, setWebhookDeliveries] = useState<any[]>([]);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null);

  const fetchWebhookStatus = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/admin/webhook/status', { headers: authHeaders });
      const data = await res.json();
      if (data.config) setWebhookStatus(data.config);
      if (data.deliveries) setWebhookDeliveries(data.deliveries);
    } catch (e) {
      console.warn('Failed fetching webhook status:', e);
    }
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/admin/webhook/test', {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      setWebhookTestResult(data);
      if (data.success) {
        setStatusMessage({ text: `✓ Webhook dispatched to CRM successfully (${data.durationMs}ms - HTTP ${data.statusCode})`, type: 'success' });
      } else {
        setStatusMessage({ text: `Webhook test completed: ${data.error || 'Server responded with code ' + data.statusCode} (${data.durationMs}ms)`, type: 'error' });
      }
      fetchWebhookStatus();
    } catch (err: any) {
      setStatusMessage({ text: `Webhook error: ${err.message}`, type: 'error' });
    } finally {
      setIsTestingWebhook(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleClearWebhookLog = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      await fetch('/api/admin/webhook/log', {
        method: 'DELETE',
        headers: authHeaders
      });
      setWebhookDeliveries([]);
      setStatusMessage({ text: '✓ Webhook delivery log cleared', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.warn('Failed clearing webhook log', err);
    }
  };

  // Fetch server status, media files, concierge knowledge, webhook status, and IMAP inbox when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchConciergeKnowledge();
      fetchWebhookStatus();
      fetch('/api/health')
        .then((r) => r.json())
        .then((data) => setServerStatus(data))
        .catch(() => {});
      fetch('/api/uploads')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.files) setMediaFiles(data.files);
        })
        .catch(() => {});
      fetch('/api/mail/inbox')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.messages) setImapMessages(data.messages);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleRefreshImap = async () => {
    setIsLoadingImap(true);
    try {
      const res = await fetch('/api/mail/inbox');
      const data = await res.json();
      if (data && data.messages) {
        setImapMessages(data.messages);
        setStatusMessage({ text: `✓ IMAP inbox refreshed (${data.messages.length} messages)`, type: 'success' });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (e) {
      setStatusMessage({ text: 'Failed to refresh IMAP inbox', type: 'error' });
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsLoadingImap(false);
    }
  };

  const handleTestImapConnection = async () => {
    setIsTestingImap(true);
    setImapTestResult(null);
    try {
      const res = await fetch('/api/mail/test-imap', { method: 'POST' });
      const data = await res.json();
      setImapTestResult(data);
    } catch (e: any) {
      setImapTestResult({
        success: false,
        connected: false,
        error: e.message || 'Connection test failed',
        details: 'Check server connection and port 993 reachability.'
      });
    } finally {
      setIsTestingImap(false);
    }
  };

  // Database testing state
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{
    connected: boolean;
    engine: string;
    host: string;
    port: number;
    database: string;
    user: string;
    error?: string | null;
    message: string;
  } | null>(null);
  const [showDbGuide, setShowDbGuide] = useState(false);

  const handleTestDbConnection = async () => {
    setIsTestingDb(true);
    setDbTestResult(null);
    try {
      const res = await fetch('/api/db/test');
      const data = await res.json();
      setDbTestResult(data);
      // Refresh server status
      fetch('/api/health')
        .then((r) => r.json())
        .then((d) => setServerStatus(d))
        .catch(() => {});
    } catch (e: any) {
      setDbTestResult({
        connected: false,
        engine: 'Local Disk Fallback',
        host: '127.0.0.1',
        port: 3306,
        database: 'u687292208_BharatvarshDB',
        user: 'u687292208_admin',
        error: e.message || 'Connection test failed',
        message: 'Failed to reach database test endpoint.'
      });
    } finally {
      setIsTestingDb(false);
    }
  };

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>(() => couponService.getCoupons());
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [cpnCode, setCpnCode] = useState('');
  const [cpnDesc, setCpnDesc] = useState('');
  const [cpnType, setCpnType] = useState<'percentage' | 'flat'>('percentage');
  const [cpnValue, setCpnValue] = useState<number>(10);
  const [cpnMinOrder, setCpnMinOrder] = useState<number>(3000);
  const [cpnMaxCap, setCpnMaxCap] = useState<number>(1500);
  const [cpnExpiry, setCpnExpiry] = useState<string>('2026-12-31');
  const [cpnLimit, setCpnLimit] = useState<number>(500);
  const [cpnBadge, setCpnBadge] = useState<string>('Festive Offer');

  // New/Edit form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Men');
  const [formProductType, setFormProductType] = useState<string>('Leather Belts');
  const [formPrice, setFormPrice] = useState<number>(3500);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(4200);
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLeatherType, setFormLeatherType] = useState('Full-Grain Vegetable-Tanned Cowhide');
  const [formHardware, setFormHardware] = useState('Solid Cast Antique Brass');
  const [formDimensions, setFormDimensions] = useState('38mm width / custom size');
  const [formImageUrl, setFormImageUrl] = useState('https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80');
  const [formBadge, setFormBadge] = useState('Artisan Signature');
  const [formInStock, setFormInStock] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formMonogram, setFormMonogram] = useState(true);
  const [formColors, setFormColors] = useState('Saddle Tan (#8B4513), Deep Espresso (#24140D)');
  const [formFeatures, setFormFeatures] = useState('Hand-beveled edges\nSaddle-stitched by hand\nSolid cast brass buckle');

  // Category manager state
  const [newCatTarget, setNewCatTarget] = useState<string>('Men');
  const [newProductTypeName, setNewProductTypeName] = useState('');

  // JSON editor state
  const [jsonText, setJsonText] = useState(catalogService.exportCatalogJSON());
  const [copied, setCopied] = useState(false);

  // AI Story Generator & Admin Verification State
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [showAiVerificationModal, setShowAiVerificationModal] = useState(false);
  const [aiDraft, setAiDraft] = useState<GeneratedStoryResult | null>(null);
  const [editableDraft, setEditableDraft] = useState<GeneratedStoryResult>({
    shortDescription: '',
    description: '',
    features: [],
    careInstructions: '',
    suggestedBadge: ''
  });
  const [aiVerified, setAiVerified] = useState(false);
  const [aiTone, setAiTone] = useState<'regal' | 'heritage' | 'contemporary'>('regal');

  const resetForm = () => {
    setEditingProduct(null);
    setIsAddingNew(false);
    setFormName('');
    setFormCategory('Men');
    setFormProductType('Leather Belts');
    setFormPrice(3500);
    setFormOriginalPrice(4200);
    setFormShortDesc('');
    setFormDesc('');
    setFormLeatherType('Full-Grain Vegetable-Tanned Cowhide');
    setFormHardware('Solid Cast Antique Brass');
    setFormDimensions('Standard custom sizing');
    setFormBadge('');
    setFormInStock(true);
    setFormFeatured(false);
    setFormMonogram(true);
    setFormColors('Saddle Tan (#8B4513), Deep Espresso (#24140D)');
    setFormFeatures('Hand-beveled edges\nSaddle-stitched by hand\nSolid cast brass');
    setAiVerified(false);
    setAiDraft(null);
    setShowAiVerificationModal(false);
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsAddingNew(false);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormProductType(prod.productType);
    setFormPrice(prod.price);
    setFormOriginalPrice(prod.originalPrice || 0);
    setFormShortDesc(prod.shortDescription);
    setFormDesc(prod.description);
    setFormLeatherType(prod.leatherType);
    setFormHardware(prod.hardware);
    setFormDimensions(prod.dimensions);
    setFormImageUrl(prod.images?.[0] || '');
    setFormBadge(prod.badge || '');
    setFormInStock(prod.inStock);
    setFormFeatured(prod.isFeatured || false);
    setFormMonogram(prod.monogramAvailable);
    setFormColors((prod.colors || []).map((c) => `${c.name} (${c.hex})`).join(', '));
    setFormFeatures((prod.features || []).join('\n'));
    setAiVerified(false);
    setAiDraft(null);
    setShowAiVerificationModal(false);
    setActiveTab('products');
  };

  const handleTriggerAiStory = async () => {
    if (!formName.trim()) {
      setStatusMessage({ text: 'Please enter a product title first so the AI can craft an authentic story.', type: 'error' });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    setIsGeneratingStory(true);
    try {
      const generated = await aiService.generateStory({
        name: formName,
        category: formCategory,
        productType: formProductType,
        leatherType: formLeatherType,
        hardware: formHardware,
        dimensions: formDimensions,
        features: formFeatures,
        tone: aiTone === 'regal' 
          ? 'Regal Indian luxury, honoring Kanpur & Dharavi vegetable tanning craftsmanship'
          : aiTone === 'heritage'
          ? 'Time-honored artisanal legacy, saddle stitching, generational durability'
          : 'Modern minimalist luxury, clean architectural lines with heirloom full-grain leather'
      });

      setAiDraft(generated);
      setEditableDraft(generated);
      setShowAiVerificationModal(true);
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Failed to generate AI story. Please try again.', type: 'error' });
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleApproveAiStory = () => {
    if (!editableDraft) return;

    setFormShortDesc(editableDraft.shortDescription);
    setFormDesc(editableDraft.description);
    if (editableDraft.features && editableDraft.features.length > 0) {
      setFormFeatures(editableDraft.features.join('\n'));
    }
    if (editableDraft.suggestedBadge) {
      setFormBadge(editableDraft.suggestedBadge);
    }

    setAiVerified(true);
    setShowAiVerificationModal(false);
    setStatusMessage({
      text: '✓ AI Luxury Story verified & approved by Admin! Applied to product fields.',
      type: 'success'
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse color string
    const parsedColors = formColors
      .split(',')
      .map((item) => {
        const match = item.match(/(.+)\s*\((#[0-9a-fA-F]{3,6})\)/);
        if (match) {
          return { name: match[1].trim(), hex: match[2].trim() };
        }
        return { name: item.trim(), hex: '#783A1D' };
      })
      .filter((c) => c.name.length > 0);

    const parsedFeatures = formFeatures
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const productPayload = {
      name: formName,
      category: formCategory,
      productType: formProductType,
      price: Number(formPrice),
      originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
      shortDescription: formShortDesc || formName,
      description: formDesc || formShortDesc,
      images: [formImageUrl],
      leatherType: formLeatherType,
      hardware: formHardware,
      dimensions: formDimensions,
      colors: parsedColors.length ? parsedColors : [{ name: 'Cognac', hex: '#8B4513' }],
      features: parsedFeatures.length ? parsedFeatures : ['Full-grain leather', 'Saddle stitched'],
      monogramAvailable: formMonogram,
      inStock: formInStock,
      badge: formBadge ? formBadge : undefined,
      isFeatured: formFeatured
    };

    if (editingProduct) {
      catalogService.updateProduct({
        ...productPayload,
        id: editingProduct.id
      });
      setStatusMessage({ text: `Updated "${formName}" successfully!`, type: 'success' });
    } else {
      catalogService.addProduct(productPayload);
      setStatusMessage({ text: `Created new product "${formName}" successfully!`, type: 'success' });
    }

    onCatalogChanged();
    resetForm();
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleDeleteProduct = (productId: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the catalog?`)) {
      catalogService.deleteProduct(productId);
      onCatalogChanged();
      setStatusMessage({ text: `Removed "${name}" from store.`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleAddProductType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductTypeName.trim()) return;

    catalogService.addProductType(newCatTarget, newProductTypeName.trim());
    setNewProductTypeName('');
    onCatalogChanged();
    setStatusMessage({
      text: `Added new product type "${newProductTypeName}" to ${newCatTarget}!`,
      type: 'success'
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleApplyJSON = () => {
    const res = catalogService.importCatalogJSON(jsonText);
    if (res.success) {
      onCatalogChanged();
      setStatusMessage({ text: `Imported ${res.count} products successfully!`, type: 'success' });
    } else {
      setStatusMessage({ text: res.error || 'Import failed', type: 'error' });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpnCode.trim()) return;

    couponService.addCoupon({
      code: cpnCode.trim().toUpperCase(),
      description: cpnDesc.trim() || `${cpnType === 'percentage' ? cpnValue + '%' : '₹' + cpnValue} promotional voucher`,
      discountType: cpnType,
      discountValue: Number(cpnValue),
      minOrderValue: Number(cpnMinOrder),
      maxDiscountCap: cpnType === 'percentage' ? Number(cpnMaxCap) : undefined,
      validUntil: cpnExpiry || undefined,
      usageLimit: Number(cpnLimit),
      isActive: true,
      badge: cpnBadge.trim() || undefined
    });

    setCoupons(couponService.getCoupons());
    setIsAddingCoupon(false);
    setCpnCode('');
    setCpnDesc('');
    setStatusMessage({ text: `Promotional coupon "${cpnCode.toUpperCase()}" created successfully!`, type: 'success' });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleToggleCoupon = (id: string) => {
    const newState = couponService.toggleCouponActive(id);
    setCoupons(couponService.getCoupons());
    setStatusMessage({ text: `Coupon ${newState ? 'activated' : 'paused'}.`, type: 'success' });
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleDeleteCoupon = (id: string, code: string) => {
    if (window.confirm(`Delete coupon "${code}" permanently?`)) {
      couponService.deleteCoupon(id);
      setCoupons(couponService.getCoupons());
      setStatusMessage({ text: `Coupon "${code}" deleted.`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  const handleResetCoupons = () => {
    if (window.confirm('Restore initial festive coupons (DIWALI2026, WELCOME10, etc.)?')) {
      const reset = couponService.resetToDefaults();
      setCoupons(reset);
      setStatusMessage({ text: 'Coupons restored to defaults.', type: 'success' });
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all catalog modifications and restore initial factory products?')) {
      catalogService.resetToDefaults();
      onCatalogChanged();
      setJsonText(catalogService.exportCatalogJSON());
      setStatusMessage({ text: 'Catalog reset to factory default.', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setFormImageUrl(data.url);
        setStatusMessage({ text: `Image saved to Host disk: ${data.filename}`, type: 'success' });
        setTimeout(() => setStatusMessage(null), 3500);
        // Refresh uploads
        fetch('/api/uploads').then((r) => r.json()).then((d) => {
          if (d.files) setMediaFiles(d.files);
        });
      } else {
        setStatusMessage({ text: data.error || 'Upload failed', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error connecting to upload endpoint', type: 'error' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteMedia = async (filename: string) => {
    if (window.confirm(`Delete "${filename}" from host disk?`)) {
      try {
        const res = await fetch(`/api/uploads/${filename}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          setMediaFiles((prev) => prev.filter((f) => f.filename !== filename));
          setStatusMessage({ text: `Deleted ${filename} from host disk`, type: 'success' });
          setTimeout(() => setStatusMessage(null), 2500);
        }
      } catch (err: any) {
        setStatusMessage({ text: err.message || 'Error deleting file', type: 'error' });
      }
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden border border-[#24140D]/15 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#24140D]/10 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#24140D] text-[#FAF7F2] flex items-center justify-center shrink-0">
              <FolderTree className="w-4 h-4 text-[#C29B38]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#24140D] leading-tight">
                Store Manager & Catalog CMS
              </h2>
              <span className="text-[11px] text-[#783A1D] uppercase tracking-wider font-semibold">
                Bharatvarsh Leathercrafts LLP Content Engine
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close admin panel"
            className="p-1.5 rounded-lg text-[#24140D]/60 hover:text-[#24140D] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-[#FAF7F2] border-b border-[#24140D]/15 flex items-center gap-6 text-xs font-semibold overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveTab('products');
              resetForm();
            }}
            className={`py-3.5 border-b-2 -mb-px cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'border-[#783A1D] text-[#783A1D] font-bold'
                : 'border-transparent text-[#24140D]/60 hover:text-[#24140D] hover:border-[#24140D]/20'
            }`}
          >
            <span>Products</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'products'
                  ? 'bg-[#783A1D]/10 text-[#783A1D]'
                  : 'bg-[#24140D]/5 text-[#24140D]/60'
              }`}
            >
              {products.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`py-3.5 border-b-2 -mb-px cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-[#783A1D] text-[#783A1D] font-bold'
                : 'border-transparent text-[#24140D]/60 hover:text-[#24140D] hover:border-[#24140D]/20'
            }`}
          >
            Category Architecture
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={`py-3.5 border-b-2 -mb-px cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'coupons'
                ? 'border-[#783A1D] text-[#783A1D] font-bold'
                : 'border-transparent text-[#24140D]/60 hover:text-[#24140D] hover:border-[#24140D]/20'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Promotions & Coupons</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'coupons'
                  ? 'bg-[#783A1D]/10 text-[#783A1D]'
                  : 'bg-[#24140D]/5 text-[#24140D]/60'
              }`}
            >
              {coupons.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!conciergeKnowledge) fetchConciergeKnowledge();
              setActiveTab('concierge');
            }}
            className={`py-3.5 border-b-2 -mb-px cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'concierge'
                ? 'border-[#783A1D] text-[#783A1D] font-bold'
                : 'border-transparent text-[#24140D]/60 hover:text-[#24140D] hover:border-[#24140D]/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C29B38]" />
            <span>AI Concierge Knowledge</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#783A1D]/10 text-[#783A1D] font-mono">
              Active Grounding
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setJsonText(catalogService.exportCatalogJSON());
              setActiveTab('json');
            }}
            className={`py-3.5 border-b-2 -mb-px cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-[#783A1D] text-[#783A1D] font-bold'
                : 'border-transparent text-[#24140D]/60 hover:text-[#24140D] hover:border-[#24140D]/20'
            }`}
          >
            JSON Source Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('server')}
            className={`py-3.5 border-b-2 -mb-px cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'server'
                ? 'border-[#783A1D] text-[#783A1D] font-bold'
                : 'border-transparent text-[#24140D]/60 hover:text-[#24140D] hover:border-[#24140D]/20'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Host & MySQL Engine</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                serverStatus?.database?.connected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {serverStatus?.database?.connected ? 'MySQL Active' : 'Disk Storage'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-3.5 border-b-2 -mb-px cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-[#783A1D] text-[#783A1D] font-bold'
                : 'border-transparent text-[#24140D]/60 hover:text-[#24140D] hover:border-[#24140D]/20'
            }`}
          >
            Owner Guide & Documentation
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between shrink-0 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)}>✕</button>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8">

          {/* TAB 1: PRODUCT LIST & EDITOR */}
          {activeTab === 'products' && (
            <div className="space-y-8">
              {/* If editing or adding new */}
              {(isAddingNew || editingProduct) ? (
                <div className="p-6 rounded-xl bg-white border border-[#24140D]/15 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#24140D]/10 pb-3">
                    <h3 className="font-serif text-lg font-bold text-[#24140D]">
                      {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Handcrafted Product'}
                    </h3>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs text-[#24140D]/60 hover:text-[#24140D] cursor-pointer"
                    >
                      Cancel & Return
                    </button>
                  </div>

                  <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#24140D] mb-1">Product Title *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. The Viceroy Full-Grain Bridle Belt"
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Top Category *</label>
                      <select
                        value={formCategory}
                        onChange={(e) => {
                          setFormCategory(e.target.value);
                          // Default product type for category
                          const cat = categories.find((c) => c.name === e.target.value);
                          if (cat && cat.productTypes.length > 0) {
                            setFormProductType(cat.productTypes[0]);
                          }
                        }}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      >
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Unisex">Unisex</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Product Type Section *</label>
                      <input
                        type="text"
                        required
                        list="available-types"
                        value={formProductType}
                        onChange={(e) => setFormProductType(e.target.value)}
                        placeholder="e.g. Leather Belts, Wallets, Purses, Backpacks..."
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                      <datalist id="available-types">
                        <option value="Leather Belts" />
                        <option value="Belts" />
                        <option value="Wallets" />
                        <option value="Purses" />
                        <option value="Backpacks" />
                        <option value="Briefcases" />
                      </datalist>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Price in INR (₹) *</label>
                      <input
                        type="number"
                        required
                        min={100}
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Original Price (₹ - Optional)</label>
                      <input
                        type="number"
                        min={0}
                        value={formOriginalPrice || ''}
                        onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-[#24140D]">Product Image (URL or Host Disk Upload)</label>
                        <span className="text-[10px] text-[#783A1D] font-mono">Local Disk: ./uploads</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          placeholder="https://... or /uploads/my-photo.jpg"
                          className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                        />
                        <label className="px-3.5 py-2 bg-[#783A1D] hover:bg-[#5C2C16] text-[#FAF7F2] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingImage ? 'Saving to Disk...' : 'Upload to Host Disk'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingImage}
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-[#24140D]/60 mt-1 flex items-center gap-1.5">
                        <HardDrive className="w-3 h-3 text-[#783A1D]" />
                        <span>Images uploaded here are stored directly on your host's local disk. You can also paste external image URLs.</span>
                      </p>
                    </div>

                    {/* AI Luxury Story Generator Banner */}
                    <div className="sm:col-span-2 p-4 rounded-xl bg-linear-to-r from-[#24140D] to-[#3D2013] text-[#FAF7F2] border border-[#C29B38]/40 shadow-sm space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#783A1D] flex items-center justify-center border border-[#C29B38]/50 shrink-0">
                            <Sparkles className="w-4 h-4 text-[#C29B38]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif text-sm font-bold text-[#FAF7F2]">
                                AI Luxury Catalog Storyteller
                              </h4>
                              {aiVerified ? (
                                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/50 flex items-center gap-1 font-sans">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  Admin Verified & Approved
                                </span>
                              ) : (
                                <span className="text-[10px] bg-[#C29B38]/20 text-[#D4B37A] px-2 py-0.5 rounded-full border border-[#C29B38]/30 font-sans">
                                  Verification Enforced
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#D4B37A]">
                              Auto-write heritage narratives, hand-bevel details, and care protocols from your item specs.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <select
                            value={aiTone}
                            onChange={(e: any) => setAiTone(e.target.value)}
                            className="bg-[#1A0E09] text-[#FAF7F2] text-xs px-2.5 py-1.5 rounded-lg border border-[#C29B38]/30 focus:outline-none focus:border-[#C29B38] cursor-pointer"
                          >
                            <option value="regal">Regal & Heritage</option>
                            <option value="heritage">Atelier Provenance</option>
                            <option value="contemporary">Modern Minimalist</option>
                          </select>

                          <button
                            type="button"
                            onClick={handleTriggerAiStory}
                            disabled={isGeneratingStory}
                            className="px-3.5 py-1.5 bg-[#C29B38] hover:bg-[#D4B37A] text-[#24140D] font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            {isGeneratingStory ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Crafting Story...</span>
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-3.5 h-3.5" />
                                <span>Generate Story</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {aiVerified && (
                        <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-600/40 text-[11px] text-emerald-200 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            <strong>Verified by Admin:</strong> You have reviewed and approved this editorial story. Ready to publish to the live storefront.
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#24140D] mb-1">Short Description (for cards) *</label>
                      <input
                        type="text"
                        required
                        value={formShortDesc}
                        onChange={(e) => setFormShortDesc(e.target.value)}
                        placeholder="38mm English bridle cut with hand-burnished edges..."
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#24140D] mb-1">Detailed Description *</label>
                      <textarea
                        rows={3}
                        required
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="Full story, craftsmanship details, hide tanning, and stitching..."
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Leather Type</label>
                      <input
                        type="text"
                        value={formLeatherType}
                        onChange={(e) => setFormLeatherType(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Hardware</label>
                      <input
                        type="text"
                        value={formHardware}
                        onChange={(e) => setFormHardware(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Dimensions</label>
                      <input
                        type="text"
                        value={formDimensions}
                        onChange={(e) => setFormDimensions(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Editorial Tag / Badge</label>
                      <input
                        type="text"
                        value={formBadge}
                        onChange={(e) => setFormBadge(e.target.value)}
                        placeholder="e.g. Masterpiece, Best Seller, Artisan"
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#24140D] mb-1">
                        Color Variations (Format: Name (#hex), Name (#hex))
                      </label>
                      <input
                        type="text"
                        value={formColors}
                        onChange={(e) => setFormColors(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#24140D] mb-1">
                        Features (one per line)
                      </label>
                      <textarea
                        rows={3}
                        value={formFeatures}
                        onChange={(e) => setFormFeatures(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-wrap gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInStock}
                          onChange={(e) => setFormInStock(e.target.checked)}
                          className="accent-[#783A1D]"
                        />
                        <span>In Stock</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formFeatured}
                          onChange={(e) => setFormFeatured(e.target.checked)}
                          className="accent-[#783A1D]"
                        />
                        <span>Feature on Homepage</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formMonogram}
                          onChange={(e) => setFormMonogram(e.target.checked)}
                          className="accent-[#783A1D]"
                        />
                        <span>Support Monogramming</span>
                      </label>
                    </div>

                    <div className="sm:col-span-2 pt-4 flex justify-end gap-3 border-t border-[#24140D]/10">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 rounded-lg border border-[#24140D]/20 hover:bg-[#FAF7F2] text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-lg bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider shadow-sm"
                      >
                        {editingProduct ? 'Save Product Changes' : 'Create & Publish Product'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Product Table View */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#24140D]/10">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-serif text-xl font-bold text-[#24140D]">Active Products</h3>
                        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#783A1D]/10 text-[#783A1D] border border-[#783A1D]/20">
                          {products.length} Items Listed
                        </span>
                      </div>
                      <p className="text-xs text-[#24140D]/65 mt-0.5">
                        Manage existing atelier inventory, catalog prices, product categories, and live availability
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        resetForm();
                        setIsAddingNew(true);
                      }}
                      className="px-4 py-2 bg-[#783A1D] hover:bg-[#8F4725] text-[#FAF7F2] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Product</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#24140D]/15 bg-white shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 z-10 bg-[#F5F0E8] border-b border-[#24140D]/15 text-[#24140D]/75 uppercase tracking-wider text-[10px] font-bold">
                        <tr>
                          <th className="py-3 px-4 font-bold">Item</th>
                          <th className="py-3 px-4 font-bold">Category</th>
                          <th className="py-3 px-4 font-bold">Type</th>
                          <th className="py-3 px-4 font-bold">Price</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                          <th className="py-3 px-4 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#24140D]/5">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                            <td className="py-3 px-4 font-medium text-[#24140D]">
                              <div className="font-semibold">{p.name}</div>
                              <div className="text-[10px] text-[#24140D]/50 font-mono">{p.id}</div>
                            </td>
                            <td className="py-3 px-4 text-[#783A1D] font-medium">{p.category}</td>
                            <td className="py-3 px-4 text-[#24140D]/80">{p.productType}</td>
                            <td className="py-3 px-4 font-mono font-semibold tabular-nums">
                              ₹{p.price.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                                {p.inStock ? 'Active' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => startEditProduct(p)}
                                className="p-1 text-[#24140D]/60 hover:text-[#783A1D] cursor-pointer"
                                title="Edit product"
                              >
                                <Edit2 className="w-3.5 h-3.5 inline" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1 text-[#24140D]/60 hover:text-red-700 cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CATEGORY ARCHITECTURE */}
          {activeTab === 'categories' && (
            <div className="space-y-8">
              <div className="p-5 rounded-xl bg-white border border-[#24140D]/15 space-y-4 shadow-sm">
                <h3 className="font-serif text-lg font-bold text-[#24140D]">
                  Add Product Type / Section
                </h3>
                <p className="text-xs text-[#24140D]/70">
                  Extend any top-level category with unlimited browsable product types (e.g. Add "Cardholders" to Men, or "Duffel Bags" to Unisex).
                </p>

                <form onSubmit={handleAddProductType} className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={newCatTarget}
                    onChange={(e) => setNewCatTarget(e.target.value)}
                    className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="New Product Type (e.g., Cardholders, Tote Bags, Travel Pouches)"
                    value={newProductTypeName}
                    onChange={(e) => setNewProductTypeName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Type</span>
                  </button>
                </form>
              </div>

              {/* Category Tree Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-5 rounded-xl bg-white border border-[#24140D]/10 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-[#24140D]/10 pb-2">
                      <h4 className="font-serif text-lg font-bold text-[#24140D]">{cat.name}</h4>
                      <span className="text-[10px] text-[#783A1D] uppercase tracking-wider font-semibold font-mono">
                        {cat.productTypes.length} Types
                      </span>
                    </div>
                    <p className="text-[11px] text-[#24140D]/60 leading-snug">{cat.description}</p>
                    
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] uppercase tracking-wider text-[#24140D]/50 font-semibold block">
                        Included Product Types:
                      </span>
                      {cat.productTypes.map((pt) => {
                        const count = products.filter(
                          (p) => p.category.toLowerCase() === cat.name.toLowerCase() && p.productType.toLowerCase() === pt.toLowerCase()
                        ).length;
                        return (
                          <div
                            key={pt}
                            className="flex items-center justify-between py-1 px-2.5 rounded bg-[#FAF7F2] text-xs text-[#24140D]"
                          >
                            <span>{pt}</span>
                            <span className="font-mono text-[11px] text-[#783A1D]">{count} items</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PROMOTIONS & FESTIVE OFFERS ENGINE */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              {/* Top Controls & Metrics */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#24140D]/10">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#24140D] flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-[#783A1D]" />
                    <span>Promotional Coupons & Festive Offers Engine</span>
                  </h3>
                  <p className="text-xs text-[#24140D]/60">
                    Configure luxury promotional codes, festive discounts (Diwali, New Year), minimum cart requirements, and usage caps.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddingCoupon(!isAddingCoupon)}
                    className="px-4 py-2 rounded-lg bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-[#C29B38]" />
                    <span>{isAddingCoupon ? 'Close Form' : 'Create New Coupon'}</span>
                  </button>
                  <button
                    onClick={handleResetCoupons}
                    className="px-3 py-2 rounded-lg border border-[#24140D]/20 hover:bg-[#EFE9DF] text-xs font-medium text-[#24140D] cursor-pointer"
                    title="Restore default festive coupons"
                  >
                    Restore Defaults
                  </button>
                </div>
              </div>

              {/* Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#24140D]/10">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#783A1D]">Total Coupons</span>
                  <div className="text-xl font-mono font-bold text-[#24140D] mt-0.5">{coupons.length}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-[#24140D]/10">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">Active Live Codes</span>
                  <div className="text-xl font-mono font-bold text-emerald-700 mt-0.5">
                    {coupons.filter((c) => c.isActive).length}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-[#24140D]/10">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C29B38]">Total Patron Redemptions</span>
                  <div className="text-xl font-mono font-bold text-[#24140D] mt-0.5">
                    {coupons.reduce((sum, c) => sum + c.usageCount, 0)}
                  </div>
                </div>
              </div>

              {/* Add New Coupon Form */}
              {isAddingCoupon && (
                <form
                  onSubmit={handleCreateCoupon}
                  className="p-5 rounded-xl bg-white border border-[#783A1D]/30 shadow-sm space-y-4 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#24140D]/10">
                    <span className="text-xs font-serif font-bold text-[#24140D] uppercase tracking-wider">
                      New Promotional Coupon
                    </span>
                    <span className="text-[11px] text-[#783A1D]">Direct Client-Side & Checkout Integration</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#24140D] mb-1">Coupon Code *</label>
                      <input
                        type="text"
                        required
                        value={cpnCode}
                        onChange={(e) => setCpnCode(e.target.value.toUpperCase())}
                        placeholder="e.g. DIWALI2026"
                        className="w-full px-3 py-2 text-xs font-mono font-bold uppercase bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#24140D] mb-1">Discount Type</label>
                      <select
                        value={cpnType}
                        onChange={(e) => setCpnType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      >
                        <option value="percentage">Percentage Discount (%)</option>
                        <option value="flat">Flat Rupee Amount (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#24140D] mb-1">
                        {cpnType === 'percentage' ? 'Percentage (e.g. 15 for 15%)' : 'Amount in INR (₹)'} *
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={cpnValue}
                        onChange={(e) => setCpnValue(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#24140D] mb-1">Min. Bag Value (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={cpnMinOrder}
                        onChange={(e) => setCpnMinOrder(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#24140D] mb-1">
                        Max Cap (₹) {cpnType === 'flat' && '(N/A)'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        disabled={cpnType === 'flat'}
                        value={cpnMaxCap}
                        onChange={(e) => setCpnMaxCap(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D] disabled:opacity-40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#24140D] mb-1">Max Redemptions Limit</label>
                      <input
                        type="number"
                        min={1}
                        value={cpnLimit}
                        onChange={(e) => setCpnLimit(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#24140D] mb-1">Badge Tag</label>
                      <input
                        type="text"
                        value={cpnBadge}
                        onChange={(e) => setCpnBadge(e.target.value)}
                        placeholder="e.g. Festive Offer"
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#24140D] mb-1">Description / Customer Benefit Note</label>
                    <input
                      type="text"
                      value={cpnDesc}
                      onChange={(e) => setCpnDesc(e.target.value)}
                      placeholder="e.g. 15% off on handcrafted heirloom leather goods for Diwali"
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCoupon(false)}
                      className="px-4 py-2 rounded-lg border border-[#24140D]/20 text-xs font-medium text-[#24140D] hover:bg-[#EFE9DF] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Save & Activate Coupon
                    </button>
                  </div>
                </form>
              )}

              {/* Coupons List */}
              <div className="space-y-3">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="p-4 rounded-xl bg-white border border-[#24140D]/10 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-[#24140D] bg-[#EFE9DF] px-2.5 py-1 rounded border border-[#24140D]/15 tracking-wider">
                          {coupon.code}
                        </span>
                        {coupon.badge && (
                          <span className="text-[10px] uppercase font-semibold text-[#783A1D] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#783A1D]/30">
                            {coupon.badge}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            coupon.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                          }`}
                        >
                          {coupon.isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>

                      <p className="text-xs text-[#24140D]/80">{coupon.description}</p>

                      <div className="flex items-center gap-4 text-[11px] text-[#24140D]/60 pt-1 flex-wrap">
                        <span>
                          Benefit: <strong className="text-[#24140D]">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}% Off${coupon.maxDiscountCap ? ` (Cap: ₹${coupon.maxDiscountCap.toLocaleString('en-IN')})` : ''}`
                              : `Flat ₹${coupon.discountValue.toLocaleString('en-IN')} Off`}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Min. Bag: <strong className="text-[#24140D]">₹{coupon.minOrderValue.toLocaleString('en-IN')}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Redemptions: <strong className="text-[#24140D] font-mono">{coupon.usageCount}</strong>
                          {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleCoupon(coupon.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                          coupon.isActive
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {coupon.isActive ? <ToggleRight className="w-4 h-4 text-emerald-700" /> : <ToggleLeft className="w-4 h-4" />}
                        <span>{coupon.isActive ? 'Active' : 'Inactive'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                        className="p-1.5 rounded-lg text-[#24140D]/40 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CONCIERGE AI KNOWLEDGE BASE */}
          {activeTab === 'concierge' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#24140D]/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl font-bold text-[#24140D]">
                      Master Concierge AI Knowledge Base
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Live Grounding Active
                    </span>
                  </div>
                  <p className="text-xs text-[#24140D]/70 mt-1 max-w-2xl">
                    Train and update the knowledge base applied to the AI Concierge. The AI acts as an authoritative Master Leather Artisan grounded exclusively in this document and the product catalog (Size and fit, Regional monsoon care, Patina development, Leather types & tanning, Bespoke packaging & 22k monogramming, Hand saddle stitching vs machine lockstitching).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchConciergeKnowledge}
                    className="px-3 py-1.5 rounded-lg border border-[#24140D]/20 text-xs font-semibold flex items-center gap-1.5 hover:bg-[#FAF7F2] cursor-pointer"
                    title="Reload from server"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reload</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveKnowledge}
                    disabled={isSavingKnowledge}
                    className="px-5 py-2 rounded-lg bg-[#783A1D] hover:bg-[#8F4725] disabled:opacity-50 text-[#FAF7F2] text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                  >
                    {isSavingKnowledge ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Apply AI Training</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {knowledgeLastModified && (
                <div className="text-[11px] text-[#24140D]/50 flex items-center justify-between">
                  <span>Last synchronized with server: {new Date(knowledgeLastModified).toLocaleString('en-IN')}</span>
                  <span className="font-mono">{conciergeKnowledge.length.toLocaleString('en-IN')} characters · {conciergeKnowledge.split(/\s+/).filter(Boolean).length.toLocaleString('en-IN')} words</span>
                </div>
              )}

              {/* Monospace Markdown Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#24140D]/70 font-medium">
                  <span>Active Knowledge Document (Markdown / Text):</span>
                  <span className="text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Strict Scope Boundary: Concierge redirects questions outside this domain.
                  </span>
                </div>
                <textarea
                  rows={18}
                  value={conciergeKnowledge}
                  onChange={(e) => setConciergeKnowledge(e.target.value)}
                  placeholder="Loading atelier knowledge base..."
                  className="w-full font-mono text-[11px] leading-relaxed p-4 bg-[#1E120A] text-[#FAF7F2] rounded-xl border border-[#24140D]/20 focus:outline-none focus:ring-2 focus:ring-[#C29B38] shadow-inner"
                  spellCheck={false}
                />
              </div>

              {/* Interactive AI Test Bench */}
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#24140D]/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#783A1D]" />
                    <h4 className="font-serif text-sm font-bold text-[#24140D]">
                      Interactive Concierge AI Test Bench
                    </h4>
                  </div>
                  <span className="text-[10px] text-[#24140D]/60 uppercase tracking-wider font-semibold">
                    Simulate Customer Inquiries
                  </span>
                </div>
                <p className="text-xs text-[#24140D]/70">
                  Test sample questions directly against the active AI model and knowledge document to verify that sizing, monsoon protocols, stitch explanations, and out-of-scope boundaries are operating correctly.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'What size belt should I order for a 34 waist?',
                    'How to protect my leather bag in Mumbai monsoon?',
                    'What is the difference between saddle stitch and machine stitch?',
                    'Explain full-grain veg-tan vs chrome tanned leather.',
                    'Can you help me write Python code?'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTestPrompt(preset)}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-[#24140D]/15 text-[#783A1D] hover:bg-[#783A1D] hover:text-white transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTestConciergePrompt();
                    }}
                    placeholder="Enter customer question to test AI concierge response..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                  />
                  <button
                    type="button"
                    onClick={handleTestConciergePrompt}
                    disabled={isTestingPrompt || !testPrompt.trim()}
                    className="px-4 py-2 bg-[#24140D] hover:bg-[#3D2013] disabled:opacity-50 text-[#FAF7F2] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {isTestingPrompt ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Querying...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Test AI</span>
                      </>
                    )}
                  </button>
                </div>

                {testResponse && (
                  <div className="mt-3 p-3.5 rounded-xl bg-white border border-[#24140D]/15 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#783A1D]">
                      <Sparkles className="w-3 h-3 text-[#C29B38]" />
                      <span>Concierge Response:</span>
                    </div>
                    <div className="text-xs text-[#24140D] whitespace-pre-wrap leading-relaxed">
                      {testResponse}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: JSON SOURCE CODE */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#24140D]">Structured Catalog JSON</h3>
                  <p className="text-xs text-[#24140D]/60">
                    Export, modify, or restore the complete store database in pure JSON.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJSON}
                    className="px-3 py-1.5 rounded-lg border border-[#24140D]/20 text-xs font-semibold flex items-center gap-1.5 hover:bg-[#EFE9DF] cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={handleResetDefaults}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-red-50 cursor-pointer"
                    title="Restore initial products"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Factory Reset</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={16}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full font-mono text-xs p-4 bg-[#24140D] text-[#EFE9DF] rounded-xl border border-[#24140D]/20 focus:outline-none focus:ring-1 focus:ring-[#C29B38]"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleApplyJSON}
                  className="px-6 py-2.5 rounded-lg bg-[#783A1D] hover:bg-[#8F4725] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  Apply & Save JSON Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: OWNER GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6 max-w-2xl text-xs text-[#24140D]/80 leading-relaxed">
              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-bold text-[#24140D]">
                  How to Manage Bharatvarsh Leathercrafts LLP
                </h3>
                <p className="text-[#24140D]/70">
                  This storefront is built with zero lock-in: products and categories can be updated through the Admin Panel UI, or directly by committing edits to <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">src/data/products.json</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 space-y-3">
                <h4 className="font-serif text-base font-bold text-[#24140D] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#783A1D] text-[#FAF7F2] text-[11px] flex items-center justify-center">1</span>
                  <span>Adding a New Product via Admin UI</span>
                </h4>
                <p>
                  Click <strong>"Add New Product"</strong> on the Products tab. Choose the top category (Men, Women, or Unisex), assign a product type section (e.g. Leather Belts, Wallets, Purses, Backpacks, Briefcases), enter the pricing in INR (₹), upload or paste an image URL, and select custom leather shades. Click <strong>"Create & Publish Product"</strong> to make it live immediately.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 space-y-3">
                <h4 className="font-serif text-base font-bold text-[#24140D] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#783A1D] text-[#FAF7F2] text-[11px] flex items-center justify-center">2</span>
                  <span>Adding New Categories or Product Types</span>
                </h4>
                <p>
                  Switch to the <strong>"Category Architecture"</strong> tab. You can add new sub-product types (e.g., "Cardholders", "Passport Sleeves", "Duffel Bags") to any top-level category. The catalog grid will instantly display the new section.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 space-y-3">
                <h4 className="font-serif text-base font-bold text-[#24140D] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#783A1D] text-[#FAF7F2] text-[11px] flex items-center justify-center">3</span>
                  <span>Connecting Live Razorpay / Stripe Payments</span>
                </h4>
                <p>
                  Payments are isolated in <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">src/services/paymentService.ts</code>. Simply add your Razorpay Key ID (<code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">VITE_RAZORPAY_KEY_ID</code>) in your <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">.env</code> file. The app will immediately activate real payment authorization with zero code edits.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: HOST & MYSQL ENGINE STATUS & MEDIA STORAGE */}
          {activeTab === 'server' && (
            <div className="space-y-6 max-w-4xl text-xs text-[#24140D]/80 leading-relaxed">
              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-bold text-[#24140D] flex items-center gap-2">
                  <Server className="w-6 h-6 text-[#783A1D]" />
                  <span>Host Environment & MySQL Database Control</span>
                </h3>
                <p className="text-[#24140D]/70">
                  Real-time status of your Hostinger shared hosting environment, MySQL database connection, local disk media storage, and SMTP mailer.
                </p>
              </div>

              {/* Status Grid: 4 Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Database Engine */}
                <div className="p-3.5 rounded-xl bg-white border border-[#24140D]/10 space-y-2 shadow-xs ring-1 ring-[#783A1D]/15">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-[#783A1D] flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      <span>Database Engine</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      serverStatus?.database?.connected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {serverStatus?.database?.connected ? 'MySQL Active' : 'Disk Fallback'}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-[#24140D]/5">
                      <span className="text-[#24140D]/60 text-[11px]">Engine:</span>
                      <strong className="font-mono text-[11px]">MySQL 8.0+</strong>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-[#24140D]/5">
                      <span className="text-[#24140D]/60 text-[11px]">Host / Port:</span>
                      <span className="font-mono text-[11px]">{serverStatus?.database?.host || '127.0.0.1'}:3306</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-[#24140D]/5">
                      <span className="text-[#24140D]/60 text-[11px]">Database:</span>
                      <strong className="font-mono text-[11px]">{serverStatus?.database?.database || 'u687292208_BharatvarshDB'}</strong>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-[#24140D]/5">
                      <span className="text-[#24140D]/60 text-[11px]">Username:</span>
                      <span className="font-mono text-[11px] truncate max-w-[95px]" title={serverStatus?.database?.user || 'u687292208_admin'}>
                        {serverStatus?.database?.user || 'u687292208_admin'}
                      </span>
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleTestDbConnection}
                        disabled={isTestingDb}
                        className="text-[10px] text-[#783A1D] font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${isTestingDb ? 'animate-spin' : ''}`} />
                        <span>{isTestingDb ? 'Testing...' : 'Test Connection'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDbGuide(!showDbGuide)}
                        className="text-[10px] text-[#24140D]/60 hover:text-[#24140D] font-medium cursor-pointer"
                      >
                        {showDbGuide ? 'Hide Guide' : 'How to Fix'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. File & Media Storage */}
                <div className="p-3.5 rounded-xl bg-white border border-[#24140D]/10 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-[#783A1D] flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Local Storage</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      Host Disk
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-[#24140D]/5">
                      <span className="text-[#24140D]/60 text-[11px]">Path:</span>
                      <span className="font-mono text-[11px]">./uploads</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-[#24140D]/5">
                      <span className="text-[#24140D]/60 text-[11px]">Stored Files:</span>
                      <strong className="text-[11px]">{mediaFiles.length} files</strong>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-[#24140D]/5">
                      <span className="text-[#24140D]/60 text-[11px]">Route:</span>
                      <span className="font-mono text-[11px]">/uploads/*</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-[#24140D]/60 text-[11px]">Upload Cap:</span>
                      <span className="text-[11px]">15 MB / file</span>
                    </div>
                  </div>
                </div>

                {/* 3. Incoming Mail: IMAP */}
                <div className="p-3.5 rounded-xl bg-white border border-[#24140D]/10 space-y-2 shadow-xs ring-1 ring-[#783A1D]/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-[#783A1D] flex items-center gap-1.5">
                      <Inbox className="w-3.5 h-3.5 text-[#783A1D]" />
                      <span>Incoming: IMAP</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      serverStatus?.imap?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {serverStatus?.imap?.configured ? 'Live IMAP' : 'Hostinger SSL'}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-[#24140D]/5">
                      <span className="text-[#24140D]/60 text-[11px]">Server:</span>
                      <span className="font-mono text-[11px] font-semibold text-[#24140D]">imap.hostinger.com:993</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-[#24140D]/5">
                      <span className="text-[#24140D]/60 text-[11px]">Protocol:</span>
                      <strong className="font-mono text-[11px] text-[#783A1D]">IMAP (SSL/TLS)</strong>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-[#24140D]/5">
                      <span className="text-[#24140D]/60 text-[11px]">User:</span>
                      <span className="font-mono text-[10px] truncate max-w-[110px]" title="support@bharatvarshcrafts.com">
                        support@bharatvarshcrafts.com
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-[#24140D]/60 text-[11px]">Function:</span>
                      <span className="text-[11px] text-emerald-800 font-medium">Customer Inquiries</span>
                    </div>
                  </div>
                </div>

                {/* 4. Outgoing Mail: SMTP */}
                <div className="p-3.5 rounded-xl bg-white border border-[#24140D]/10 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-[#783A1D] flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-[#783A1D]" />
                      <span>Outgoing: SMTP</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      serverStatus?.smtp?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {serverStatus?.smtp?.configured ? 'Live SMTP' : 'Hostinger SSL'}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-[#24140D]/5">
                      <span className="text-[#24140D]/60 text-[11px]">Server:</span>
                      <span className="font-mono text-[11px] font-semibold text-[#24140D]">smtp.hostinger.com:465</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-[#24140D]/5">
                      <span className="text-[#24140D]/60 text-[11px]">Protocol:</span>
                      <strong className="font-mono text-[11px] text-[#783A1D]">SMTP (SSL/TLS)</strong>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-[#24140D]/5">
                      <span className="text-[#24140D]/60 text-[11px]">User:</span>
                      <span className="font-mono text-[10px] truncate max-w-[110px]" title="support@bharatvarshcrafts.com">
                        support@bharatvarshcrafts.com
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-[#24140D]/60 text-[11px]">Function:</span>
                      <span className="text-[11px] text-blue-800 font-medium">GST Invoices & Alerts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MYSQL DATABASE DIAGNOSTIC & HOSTINGER SETUP GUIDE */}
              <div className="p-4 rounded-xl bg-white border border-[#24140D]/15 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#24140D]/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#783A1D]/10 border border-[#783A1D]/20 flex items-center justify-center text-[#783A1D] shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-sm font-bold text-[#24140D]">
                          MySQL 8.0+ Database Engine &amp; Connectivity
                        </h4>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          serverStatus?.database?.connected
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {serverStatus?.database?.connected ? '✓ MySQL Active' : '● Host Disk Fallback Active'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#24140D]/60">
                        Configured for Hostinger MySQL on <code className="font-mono bg-[#FAF7F2] px-1 rounded">localhost:3306</code> with resilient automatic disk fallback.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleTestDbConnection}
                      disabled={isTestingDb}
                      className="px-3.5 py-1.5 rounded-lg border border-[#783A1D]/30 bg-[#FAF7F2] hover:bg-[#FAF7F2]/80 text-[#783A1D] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                      <span>{isTestingDb ? 'Testing Connection...' : 'Test MySQL (3306)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDbGuide(!showDbGuide)}
                      className="px-3 py-1.5 rounded-lg bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                    >
                      {showDbGuide ? 'Close Setup Guide' : 'How to Fix / Connect Live'}
                    </button>
                  </div>
                </div>

                {/* MySQL Test Result Banner */}
                {dbTestResult && (
                  <div className={`p-3 rounded-lg text-xs border flex items-start gap-2.5 ${
                    dbTestResult.connected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    {dbTestResult.connected ? (
                      <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 flex-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>
                          {dbTestResult.connected
                            ? `✓ Successfully Connected to MySQL (${dbTestResult.host}:${dbTestResult.port} / ${dbTestResult.database})`
                            : `Current Status: Disk Fallback Mode Active (Safe Storage)`}
                        </span>
                        <span className="font-mono text-[10px] opacity-75">Engine: {dbTestResult.engine}</span>
                      </div>
                      <div className="text-[11px] opacity-90 leading-relaxed">
                        {dbTestResult.message}
                      </div>
                      {dbTestResult.error && (
                        <div className="text-[10px] font-mono bg-black/5 p-1.5 rounded border border-black/10 text-amber-950">
                          Diagnostic Code: {dbTestResult.error}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDbTestResult(null)}
                      className="text-xs opacity-60 hover:opacity-100 p-0.5 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Expandable or Default Hostinger Step-by-Step MySQL Guide */}
                {(showDbGuide || !serverStatus?.database?.connected) && (
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#24140D]/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-serif text-xs font-bold text-[#24140D] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#C29B38]" />
                        <span>Why does it show &quot;Disk Fallback&quot; &amp; How to Connect MySQL</span>
                      </h5>
                      <span className="text-[10px] text-[#783A1D] font-medium bg-[#783A1D]/10 px-2 py-0.5 rounded">
                        Hostinger hPanel Guide
                      </span>
                    </div>

                    <p className="text-[11px] text-[#24140D]/75 leading-relaxed">
                      <strong>Nothing is broken!</strong> In this cloud preview container, an external MySQL server is not running on <code>localhost:3306</code>. To protect your storefront, the app automatically runs in <strong>High-Availability Local Disk Fallback</strong> (persisting products, orders, and inquiries safely in <code>data/catalog_storage.json</code>).
                    </p>

                    <div className="space-y-2 pt-1">
                      <div className="font-semibold text-xs text-[#24140D]">
                        To connect your live MySQL database on Hostinger in 3 simple steps:
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                        <div className="p-3 bg-white rounded-lg border border-[#24140D]/10 space-y-1">
                          <div className="font-bold text-[#783A1D] flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-[#783A1D] text-white text-[9px] flex items-center justify-center">1</span>
                            <span>Create in hPanel</span>
                          </div>
                          <p className="text-[#24140D]/70">
                            Go to <strong>Hostinger hPanel &rarr; Databases &rarr; MySQL Databases</strong>. Create a database name and user with a secure password.
                          </p>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-[#24140D]/10 space-y-1">
                          <div className="font-bold text-[#783A1D] flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-[#783A1D] text-white text-[9px] flex items-center justify-center">2</span>
                            <span>Update .env File</span>
                          </div>
                          <p className="text-[#24140D]/70">
                            In your website files, edit <code>.env</code> and replace the placeholder credentials with your actual Hostinger MySQL details.
                          </p>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-[#24140D]/10 space-y-1">
                          <div className="font-bold text-[#783A1D] flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-[#783A1D] text-white text-[9px] flex items-center justify-center">3</span>
                            <span>Restart Runner</span>
                          </div>
                          <p className="text-[#24140D]/70">
                            Click <strong>Restart</strong> in Hostinger Application Manager. The tables auto-create and this badge turns <strong>MySQL Active</strong>!
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-[#24140D] rounded-lg text-[#FAF7F2] space-y-2 mt-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-[#D4B37A]">.env configuration snippet:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const snippet = `DB_HOST=127.0.0.1\nDB_PORT=3306\nDB_NAME=u687292208_BharatvarshDB\nDB_USER=u687292208_admin\nDB_PASSWORD=SDM@Pune1`;
                              navigator.clipboard.writeText(snippet);
                              setStatusMessage({ text: 'Copied MySQL .env template to clipboard!', type: 'success' });
                              setTimeout(() => setStatusMessage(null), 2500);
                            }}
                            className="text-[10px] text-[#C29B38] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy .env Template</span>
                          </button>
                        </div>
                        <pre className="text-[10px] font-mono leading-relaxed text-[#EFE9DF] overflow-x-auto">
{`DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=u687292208_BharatvarshDB
DB_USER=u687292208_admin
DB_PASSWORD=SDM@Pune1`}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* IMAP INCOMING SUPPORT INBOX VIEWER */}
              <div className="p-4 rounded-xl bg-white border border-[#24140D]/15 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#24140D]/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#783A1D]/10 border border-[#783A1D]/20 flex items-center justify-center text-[#783A1D] shrink-0">
                      <Inbox className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-sm font-bold text-[#24140D]">
                          Incoming Support Mailbox (IMAP — support@bharatvarshcrafts.com)
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#783A1D] border border-[#783A1D]/30">
                          imap.hostinger.com:993
                        </span>
                      </div>
                      <p className="text-[11px] text-[#24140D]/60">
                        Patron inquiries, corporate gifting briefs, and size consultations synced via Hostinger IMAP.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleTestImapConnection}
                      disabled={isTestingImap}
                      className="px-3 py-1.5 rounded-lg border border-[#783A1D]/30 bg-[#FAF7F2] hover:bg-[#FAF7F2]/80 text-[#783A1D] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingImap ? 'animate-spin' : ''}`} />
                      <span>{isTestingImap ? 'Testing IMAP...' : 'Test IMAP (993)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRefreshImap}
                      disabled={isLoadingImap}
                      className="px-3.5 py-1.5 rounded-lg bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingImap ? 'animate-spin' : ''}`} />
                      <span>{isLoadingImap ? 'Syncing...' : 'Sync Inbox'}</span>
                    </button>
                  </div>
                </div>

                {/* IMAP Test Result Banner */}
                {imapTestResult && (
                  <div className={`p-3 rounded-lg text-xs border flex items-start gap-2.5 ${
                    imapTestResult.connected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    {imapTestResult.connected ? (
                      <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold">
                        {imapTestResult.connected
                          ? `✓ Connected to Hostinger IMAP (imap.hostinger.com:993 SSL)`
                          : `IMAP Connectivity Notice: ${imapTestResult.error || 'Connection Failed'}`}
                      </div>
                      <div className="text-[11px] opacity-90 leading-relaxed">
                        {imapTestResult.details}
                        {imapTestResult.messageCount !== undefined && (
                          <span className="font-mono ml-2 font-semibold">
                            (Total Messages: {imapTestResult.messageCount}, Unread: {imapTestResult.unseenCount || 0})
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImapTestResult(null)}
                      className="text-xs opacity-60 hover:opacity-100 p-0.5 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* IMAP Messages List */}
                {imapMessages.length === 0 ? (
                  <div className="text-center py-8 text-[#24140D]/50 bg-[#FAF7F2] rounded-lg border border-dashed border-[#24140D]/15">
                    No messages in IMAP INBOX. Click &quot;Sync Inbox&quot; or &quot;Test IMAP (993)&quot; above.
                  </div>
                ) : (
                  <div className="divide-y divide-[#24140D]/10 border border-[#24140D]/10 rounded-lg overflow-hidden bg-white max-h-80 overflow-y-auto">
                    {imapMessages.map((msg) => (
                      <div
                        key={msg.uid}
                        onClick={() => setSelectedMail(msg)}
                        className={`p-3 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          msg.unread ? 'bg-[#FAF7F2]/80 hover:bg-[#FAF7F2]' : 'hover:bg-neutral-50'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {msg.unread && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#783A1D] text-[#FAF7F2] tracking-wider uppercase">
                                New
                              </span>
                            )}
                            <span className="font-semibold text-xs text-[#24140D] truncate">
                              {msg.from}
                            </span>
                            <span className="text-[10px] text-[#24140D]/50 font-mono">
                              &lt;{msg.fromAddress}&gt;
                            </span>
                          </div>
                          <div className="text-xs font-medium text-[#24140D] truncate">
                            {msg.subject}
                          </div>
                          <div className="text-[11px] text-[#24140D]/65 line-clamp-1">
                            {msg.snippet}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <span className="text-[10px] text-[#24140D]/50 font-mono">
                            {new Date(msg.date).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-[11px] text-[#783A1D] font-semibold hover:underline">
                            Inspect &rarr;
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hostinger Application Runner Architecture Card */}
              <div className="p-4 rounded-xl bg-linear-to-r from-[#24140D] to-[#3D2013] text-[#FAF7F2] border border-[#C29B38]/30 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#783A1D] flex items-center justify-center text-[#C29B38] shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#FAF7F2]">
                      Hostinger hPanel Built-In Application Runner Optimization
                    </h4>
                    <p className="text-[11px] text-[#D4B37A]">
                      server.js is standalone and unbundled — esbuild is never invoked during production deployment.
                    </p>
                  </div>
                </div>
                <div className="text-xs text-[#EFE9DF] space-y-1 pl-9">
                  <p>• <strong>Zero Bundling Required:</strong> Hostinger runs <code>npm install --production</code> which skips devDependencies. <code>server.js</code> uses standard native Node.js ES Modules directly.</p>
                  <p>• <strong>Hostinger Port Binding:</strong> Listens on <code>const port = process.env.PORT || 3000</code> bound to <code>0.0.0.0</code>.</p>
                  <p>• <strong>Startup Command:</strong> Hostinger&apos;s Application Runner simply runs <code>node server.js</code>.</p>
                  <p>• <strong>Resilient Database Mode:</strong> If MySQL credentials are being updated or MySQL is restarting, the server automatically serves and persists data via local disk storage without dropping requests.</p>
                </div>
              </div>

              {/* Media Library (Host Disk Storage) */}
              <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-base font-bold text-[#24140D] flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#783A1D]" />
                      <span>Host Local Disk Media Library (./uploads)</span>
                    </h4>
                    <p className="text-[11px] text-[#24140D]/60">
                      Files currently stored on the host&apos;s local disk. Click &apos;Copy URL&apos; to use or delete unneeded files.
                    </p>
                  </div>
                  <label className="px-3.5 py-1.5 bg-[#783A1D] hover:bg-[#5C2C16] text-[#FAF7F2] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image to Disk</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingImage}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {mediaFiles.length === 0 ? (
                  <div className="text-center py-8 text-[#24140D]/50 bg-[#FAF7F2] rounded-lg border border-dashed border-[#24140D]/15">
                    No uploaded images on local disk yet. Upload product photos or custom crests above.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1">
                    {mediaFiles.map((f: any) => (
                      <div key={f.filename} className="p-2 rounded-lg border border-[#24140D]/10 bg-[#FAF7F2] flex flex-col justify-between group">
                        <div className="aspect-square w-full rounded bg-white overflow-hidden flex items-center justify-center border border-[#24140D]/5 mb-1.5">
                          <img src={f.url} alt={f.filename} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-[10px] text-[#24140D]/70 truncate font-mono mb-1" title={f.filename}>
                          {f.filename}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-[#24140D]/10">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(f.url);
                              setStatusMessage({ text: `Copied URL: ${f.url}`, type: 'success' });
                              setTimeout(() => setStatusMessage(null), 2000);
                            }}
                            className="text-[10px] text-[#783A1D] font-bold hover:underline cursor-pointer"
                          >
                            Copy URL
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMedia(f.filename)}
                            className="text-[#991B1B] hover:text-red-700 p-0.5 cursor-pointer"
                            title="Delete file from host disk"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. CRM Webhook Dispatcher & Hostinger Live Integration */}
              <div className="p-5 rounded-2xl bg-white border border-[#24140D]/10 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24140D]/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#783A1D] flex items-center justify-center text-[#C29B38] shadow-xs">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-sm font-bold text-[#24140D]">
                          Hostinger CRM Webhook Dispatcher
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          webhookStatus?.configured
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {webhookStatus?.configured ? 'Active & Dispatched' : 'URL Unset'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#24140D]/65">
                        Dispatches signed, real-time events (<code className="font-mono bg-black/5 px-1 py-0.5 rounded">order.created</code>, <code className="font-mono bg-black/5 px-1 py-0.5 rounded">inquiry.created</code>, <code className="font-mono bg-black/5 px-1 py-0.5 rounded">order.updated</code>) to your Hostinger CRM system.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchWebhookStatus}
                      className="px-2.5 py-1.5 rounded-lg border border-[#24140D]/20 hover:bg-[#FAF7F2] text-xs font-medium flex items-center gap-1 cursor-pointer"
                      title="Refresh status"
                    >
                      <RefreshCw className="w-3 h-3 text-[#24140D]/70" />
                      <span>Refresh</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={isTestingWebhook}
                      className="px-3.5 py-1.5 rounded-lg bg-[#783A1D] hover:bg-[#8F4725] disabled:opacity-50 text-[#FAF7F2] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      {isTestingWebhook ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Pinging CRM...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Test Webhook Ping</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Webhook Configuration Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#24140D]/10 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#783A1D]">
                      Target Endpoint (CRM_WEBHOOK_URL)
                    </div>
                    <div className="font-mono text-[11px] text-[#24140D] truncate select-all" title={webhookStatus?.url}>
                      {webhookStatus?.url || 'https://papayawhip-rail-174498.hostingersite.com/'}
                    </div>
                    <div className="text-[10px] text-[#24140D]/50">
                      Payloads posted via HTTP POST with JSON body and HMAC-SHA256 signature
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#24140D]/10 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#783A1D]">
                      HMAC Signature Secret (CRM_WEBHOOK_SECRET)
                    </div>
                    <div className="font-mono text-[11px] text-[#24140D] flex items-center justify-between">
                      <span>{webhookStatus?.maskedSecret || 'blc_wh••••••••2026!'}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                        SHA256 Ready
                      </span>
                    </div>
                    <div className="text-[10px] text-[#24140D]/50">
                      Verified via <code className="font-mono">X-Webhook-Signature</code> &amp; <code className="font-mono">X-Webhook-Secret</code> headers
                    </div>
                  </div>
                </div>

                {/* Test Ping Result Banner */}
                {webhookTestResult && (
                  <div className={`p-3.5 rounded-xl text-xs border flex items-start gap-2.5 animate-fadeIn ${
                    webhookTestResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}>
                    {webhookTestResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 flex-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>
                          {webhookTestResult.success
                            ? `✓ Webhook Dispatch Confirmed (${webhookTestResult.durationMs}ms)`
                            : `Webhook Dispatch Attempt Completed (${webhookTestResult.durationMs}ms)`}
                        </span>
                        <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.5 rounded">
                          HTTP {webhookTestResult.statusCode || 'N/A'}
                        </span>
                      </div>
                      <div className="text-[11px] leading-relaxed">
                        Target: <code className="font-mono">{webhookTestResult.targetUrl}</code> · Event: <code className="font-mono">{webhookTestResult.event}</code>
                      </div>
                      {webhookTestResult.error && (
                        <div className="text-[10px] font-mono bg-red-100/60 p-1.5 rounded border border-red-200 text-red-900">
                          Diagnostic: {webhookTestResult.error}
                        </div>
                      )}
                      {webhookTestResult.responseSnippet && (
                        <div className="text-[10px] font-mono bg-black/5 p-1.5 rounded border border-black/10 max-h-24 overflow-y-auto">
                          Response Preview: {webhookTestResult.responseSnippet}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setWebhookTestResult(null)}
                      className="text-xs opacity-60 hover:opacity-100 p-0.5 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Delivery History Log */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#24140D]">
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-[#783A1D]" />
                      <span>Live Webhook Deliveries ({webhookDeliveries.length})</span>
                    </div>
                    {webhookDeliveries.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearWebhookLog}
                        className="text-[10px] text-red-700 hover:underline cursor-pointer"
                      >
                        Clear History
                      </button>
                    )}
                  </div>

                  {webhookDeliveries.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#24140D]/10 text-center text-xs text-[#24140D]/60">
                      No webhooks dispatched yet. Click <strong>&quot;Send Test Webhook Ping&quot;</strong> above, or place an order to see live events.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-56 rounded-xl border border-[#24140D]/10">
                      <table className="w-full text-left text-xs bg-white">
                        <thead className="bg-[#FAF7F2] text-[#24140D]/70 font-semibold text-[10px] uppercase border-b border-[#24140D]/10">
                          <tr>
                            <th className="py-2 px-3">Event</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Latency</th>
                            <th className="py-2 px-3">Event ID</th>
                            <th className="py-2 px-3 text-right">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#24140D]/5 text-[11px]">
                          {webhookDeliveries.map((del, i) => (
                            <tr key={del.eventId || i} className="hover:bg-[#FAF7F2]/60 font-mono">
                              <td className="py-2 px-3 font-semibold text-[#783A1D]">{del.event}</td>
                              <td className="py-2 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  del.success
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {del.statusCode ? `HTTP ${del.statusCode}` : (del.success ? 'OK' : 'Error')}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#24140D]/70">{del.durationMs}ms</td>
                              <td className="py-2 px-3 text-[#24140D]/50 text-[10px]">{del.eventId}</td>
                              <td className="py-2 px-3 text-right text-[#24140D]/60 text-[10px]">
                                {new Date(del.timestamp).toLocaleTimeString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* AI STORY REVIEW & ADMIN VERIFICATION DIALOG */}
      {showAiVerificationModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-3xl bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden border border-[#C29B38]/50 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Verification Header */}
            <div className="px-6 py-4 bg-[#24140D] text-[#FAF7F2] border-b border-[#C29B38]/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#783A1D] flex items-center justify-center border border-[#C29B38] text-[#C29B38]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-base font-bold text-[#FAF7F2]">
                      Admin Verification: Luxury Story Draft
                    </h3>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 uppercase font-mono font-semibold">
                      Pending Verification
                    </span>
                  </div>
                  <p className="text-[11px] text-[#D4B37A]">
                    Review & edit before approving for live catalog publication
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAiVerificationModal(false)}
                className="p-1.5 rounded-lg text-[#FAF7F2]/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close verification modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verification Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-[#24140D]">
              
              {/* Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Verification Requirement:</strong> Review the AI-generated luxury story below. You can tweak or rewrite any section. <em>This story will NOT be published until you click &quot;Approve &amp; Apply to Product&quot; below.</em>
                </div>
              </div>

              {/* Editable Short Hook */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#24140D] uppercase text-[10px] tracking-wider">
                  1. Luxury Summary Hook (for Catalog Cards)
                </label>
                <input
                  type="text"
                  value={editableDraft.shortDescription}
                  onChange={(e) =>
                    setEditableDraft({ ...editableDraft, shortDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D] text-xs"
                />
              </div>

              {/* Editable Detailed Story */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#24140D] uppercase text-[10px] tracking-wider">
                  2. Evocative Product Narrative &amp; Provenance
                </label>
                <textarea
                  rows={6}
                  value={editableDraft.description}
                  onChange={(e) =>
                    setEditableDraft({ ...editableDraft, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D] text-xs leading-relaxed"
                />
              </div>

              {/* Editable Features */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#24140D] uppercase text-[10px] tracking-wider">
                  3. Key Craft Highlights (one per line)
                </label>
                <textarea
                  rows={4}
                  value={editableDraft.features.join('\n')}
                  onChange={(e) =>
                    setEditableDraft({
                      ...editableDraft,
                      features: e.target.value.split('\n').filter((f) => f.trim().length > 0)
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D] text-xs font-mono"
                />
              </div>

              {/* Editable Care Instructions & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-[#24140D] uppercase text-[10px] tracking-wider">
                    4. Indian Climate Care Protocols
                  </label>
                  <textarea
                    rows={3}
                    value={editableDraft.careInstructions || ''}
                    onChange={(e) =>
                      setEditableDraft({ ...editableDraft, careInstructions: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D] text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-[#24140D] uppercase text-[10px] tracking-wider">
                    5. Suggested Luxury Editorial Badge
                  </label>
                  <input
                    type="text"
                    value={editableDraft.suggestedBadge || ''}
                    onChange={(e) =>
                      setEditableDraft({ ...editableDraft, suggestedBadge: e.target.value })
                    }
                    placeholder="e.g. Masterpiece, Atelier Signature"
                    className="w-full px-3 py-2 bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D] text-xs"
                  />
                </div>
              </div>

            </div>

            {/* Verification Footer Actions */}
            <div className="px-6 py-4 bg-[#EFE9DF] border-t border-[#24140D]/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowAiVerificationModal(false)}
                className="px-4 py-2 rounded-lg border border-[#24140D]/20 hover:bg-[#FAF7F2] text-xs font-semibold cursor-pointer"
              >
                Discard Draft
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerAiStory}
                  disabled={isGeneratingStory}
                  className="px-3.5 py-2 rounded-lg bg-white border border-[#24140D]/20 hover:bg-[#FAF7F2] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingStory ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>

                <button
                  type="button"
                  onClick={handleApproveAiStory}
                  className="px-5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Approve &amp; Apply to Product</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* IMAP MESSAGE DETAIL INSPECTION DIALOG */}
      {selectedMail && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden border border-[#783A1D]/40 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-[#24140D] text-[#FAF7F2] border-b border-[#783A1D]/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#783A1D] flex items-center justify-center text-[#FAF7F2] shrink-0">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#FAF7F2] line-clamp-1">
                    {selectedMail.subject}
                  </h3>
                  <p className="text-[11px] text-[#D4B37A]">
                    Received via Hostinger IMAP (imap.hostinger.com:993)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMail(null)}
                className="p-1.5 rounded-lg text-[#FAF7F2]/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close message inspection"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Metadata & Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-[#24140D]">
              <div className="p-3.5 rounded-xl bg-white border border-[#24140D]/10 space-y-2">
                <div className="flex justify-between py-1 border-b border-[#24140D]/5">
                  <span className="text-[#24140D]/60 font-semibold">From:</span>
                  <span className="font-medium text-[#24140D]">
                    {selectedMail.from} &lt;<span className="font-mono text-[#783A1D]">{selectedMail.fromAddress}</span>&gt;
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#24140D]/5">
                  <span className="text-[#24140D]/60 font-semibold">To Mailbox:</span>
                  <span className="font-mono text-[#24140D]">support@bharatvarshcrafts.com</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#24140D]/5">
                  <span className="text-[#24140D]/60 font-semibold">Date &amp; Time:</span>
                  <span className="font-mono text-[#24140D]">
                    {new Date(selectedMail.date).toLocaleString('en-IN', {
                      dateStyle: 'full',
                      timeStyle: 'medium'
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#24140D]/60 font-semibold">IMAP UID:</span>
                  <span className="font-mono text-[#24140D]">#{selectedMail.uid}</span>
                </div>
              </div>

              {/* Message Body Content */}
              <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 space-y-2">
                <div className="text-[10px] uppercase font-bold text-[#783A1D] tracking-wider">
                  Inquiry Message Body:
                </div>
                <div className="text-xs leading-relaxed text-[#24140D] whitespace-pre-wrap font-sans">
                  {selectedMail.snippet}
                </div>
              </div>

              <div className="text-[11px] text-[#24140D]/60 italic">
                * Note: This email was fetched from your Hostinger IMAP mail server (Port 993, SSL/TLS). Replying will open your configured email client or you can respond directly via support@bharatvarshcrafts.com.
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-[#EFE9DF] border-t border-[#24140D]/10 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedMail(null)}
                className="px-4 py-2 rounded-lg border border-[#24140D]/20 hover:bg-[#FAF7F2] text-xs font-semibold cursor-pointer"
              >
                Close
              </button>

              <a
                href={`mailto:${selectedMail.fromAddress}?subject=Re: ${encodeURIComponent(selectedMail.subject)}&body=Dear ${encodeURIComponent(selectedMail.from)},%0D%0A%0D%0AThank you for contacting Bharatvarsh Leathercrafts LLP regarding your inquiry.`}
                className="px-5 py-2 rounded-lg bg-[#783A1D] hover:bg-[#5C2C16] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Reply to Patron</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
