import React, { useState, useEffect } from 'react';
import { 
  Box, Card, Typography, Button, Grid, Chip, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, 
  IconButton, Alert, Divider, CircularProgress, Tooltip,
  InputAdornment, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExtensionIcon from '@mui/icons-material/Extension';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { getTemplates, createTemplate } from '../services/mouApi';

const TEMPLATE_COLORS = ['#3B82F6', '#14B8A6', '#F59E0B', '#EC4899', '#8B5CF6', '#F97316'];

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // New Template Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateNotes, setTemplateNotes] = useState('');
  const [customFields, setCustomFields] = useState([{ name: 'duration', label: 'Duration (Months)', type: 'number' }]);
  const [submitting, setSubmitting] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddField = () => {
    setCustomFields(prev => [...prev, { name: '', label: '', type: 'text' }]);
  };

  const handleRemoveField = (index) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, key, val) => {
    setCustomFields(prev => {
      const updated = [...prev];
      updated[index][key] = val;
      if (key === 'label') {
        updated[index].name = val.toLowerCase().replace(/\s+/g, '_');
      }
      return updated;
    });
  };

  const handleCreate = async () => {
    if (!name) return;
    setSubmitting(true);
    try {
      await createTemplate({
        name,
        description,
        template_notes: templateNotes,
        fields_schema: customFields.filter(f => f.label.trim() !== ''),
      });
      setCreateDialogOpen(false);
      setName('');
      setDescription('');
      setTemplateNotes('');
      setCustomFields([{ name: 'duration', label: 'Duration (Months)', type: 'number' }]);
      fetchTemplates();
    } catch (err) {
      console.error('Create template failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ flexGrow: 1 }} className="animate-fade-slide-up">
      
      {/* ── Page Header ── */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '14px',
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <ExtensionIcon />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Dynamic MOU Templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure dynamic agreement schemas, custom field rules, and explanatory notes for non-technical users.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              borderRadius: '12px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              boxShadow: '0 6px 20px rgba(79,70,229,0.3)'
            }}
          >
            + Create New Template
          </Button>
        </Box>
      </Box>

      {/* ── Content Grid ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredTemplates.map((tmpl, idx) => {
            const accentColor = TEMPLATE_COLORS[idx % TEMPLATE_COLORS.length];
            return (
              <Grid item xs={12} sm={6} md={4} key={tmpl.id}>
                <Card 
                  className="card-lift"
                  sx={{ 
                    p: 3, 
                    borderRadius: '20px', 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderLeft: `4px solid ${accentColor}`,
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Chip label={`${tmpl.mou_count || 0} MOUs Created`} size="small" sx={{ fontWeight: 800, bgcolor: `${accentColor}15`, color: accentColor }} />
                      <Chip label={tmpl.is_active ? 'Active' : 'Disabled'} color={tmpl.is_active ? 'success' : 'default'} size="small" sx={{ fontWeight: 700 }} />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      {tmpl.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6, minHeight: '3em' }}>
                      {tmpl.description || 'Standard agreement template schema.'}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                      Custom Field Inputs ({tmpl.fields_schema?.length || 0})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
                      {(tmpl.fields_schema || []).map((f) => (
                        <Chip key={f.name} label={`${f.label} (${f.type})`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                      ))}
                    </Box>
                  </Box>

                  <Box>
                    {tmpl.template_notes && (
                      <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'flex-start' }}>
                          <InfoOutlinedIcon sx={{ fontSize: '0.9rem', color: accentColor, mt: 0.2, flexShrink: 0 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.74rem', lineHeight: 1.5 }}>
                            <strong>Template Note: </strong>{tmpl.template_notes}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setPreviewTemplate(tmpl)}
                      sx={{ borderRadius: '10px', fontWeight: 700 }}
                    >
                      Preview Live Form Layout
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Dialog: Create Dynamic Template Builder ── */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Create Dynamic MOU Template</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Define custom input fields and coordinator notes. Field schemas render automatically on the MOU creation wizard.
          </Typography>

          <TextField
            fullWidth
            required
            label="Template Name"
            placeholder="e.g. Student Exchange / Faculty Development / Lab Setup"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Template Description"
            placeholder="Brief overview of when this template should be used..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Template Notes (Guidance for Non-Technical Users)"
            placeholder="Explain field definitions and mandatory requirements for department coordinators..."
            value={templateNotes}
            onChange={(e) => setTemplateNotes(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
            Dynamic Fields Builder
          </Typography>

          {customFields.map((f, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Field Label"
                placeholder="e.g. Monthly Stipend ($)"
                value={f.label}
                onChange={(e) => handleFieldChange(i, 'label', e.target.value)}
                sx={{ flex: 2 }}
              />
              <TextField
                select
                size="small"
                label="Type"
                value={f.type}
                onChange={(e) => handleFieldChange(i, 'type', e.target.value)}
                sx={{ flex: 1 }}
              >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="date">Date</MenuItem>
              </TextField>
              <IconButton size="small" color="error" onClick={() => handleRemoveField(i)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}

          <Button size="small" startIcon={<AddIcon />} onClick={handleAddField} sx={{ mt: 1, fontWeight: 700 }}>
            + Add Custom Field
          </Button>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={submitting}
            sx={{ borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
          >
            {submitting ? 'Saving Schema...' : 'Save Template Schema'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Live Form Layout Preview ── */}
      <Dialog
        open={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Live Form Layout Preview
        </DialogTitle>
        <DialogContent>
          <Chip label={previewTemplate?.name} size="small" color="primary" sx={{ fontWeight: 800, mb: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            This is how department users will see the input fields during MOU creation:
          </Typography>

          {(previewTemplate?.fields_schema || []).map((f) => (
            <TextField
              key={f.name}
              fullWidth
              disabled
              size="small"
              label={f.label}
              placeholder={`[${f.type.toUpperCase()} Input Field]`}
              sx={{ mb: 2 }}
            />
          ))}

          {previewTemplate?.template_notes && (
            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.18)', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong style={{ color: '#4F46E5' }}>Guidance Note: </strong>{previewTemplate.template_notes}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPreviewTemplate(null)} variant="contained" sx={{ borderRadius: '10px', fontWeight: 700 }}>
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Templates;
