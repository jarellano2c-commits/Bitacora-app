import React, { useState, useEffect } from 'react';
import { Camera, FileText, Thermometer, CheckCircle, Trash2, Download, ArrowLeft, Plus, Droplets, Users, Snowflake, Flame, AlertTriangle, MapPin } from 'lucide-react';

// --- COMPONENTES AUXILIARES ---

const ImageUploader = ({ label, fieldName, value, onUpload, onRemove, compact = false }) => (
  <div className={`border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors ${compact ? 'p-2' : 'p-4 mb-4'}`}>
    <p className={`font-semibold text-gray-700 mb-2 flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      <Camera size={compact ? 14 : 18} /> {label}
    </p>
    
    {value ? (
      <div className="relative">
        <img src={value} alt="Evidencia" className={`w-full object-cover rounded-md shadow-sm ${compact ? 'h-24' : 'h-40'}`} />
        <button 
          onClick={() => onRemove(fieldName)}
          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md"
        >
          <Trash2 size={12} />
        </button>
      </div>
    ) : (
      <label className="cursor-pointer flex flex-col items-center justify-center bg-white border border-gray-300 text-gray-700 rounded-md hover:text-blue-600 py-4">
        <Plus size={20} />
        <span className="text-xs mt-1">Foto</span>
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={(e) => onUpload(e, fieldName)} 
        />
      </label>
    )}
  </div>
);

const SectionTitle = ({ title, icon: Icon }) => (
  <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 pb-2 border-b-2 border-slate-200 flex items-center gap-2">
    {title}
    {Icon && <Icon className="ml-auto text-slate-400" size={20} />}
  </h2>
);

const DynamicItem = ({ item, listName, options, placeholder, showRiskAlert = false, onUpdate, onRemove, onPhotoUpload }) => (
  <div className="border rounded-lg p-3 mb-3 bg-white shadow-sm relative">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Alimento</label>
        <input 
          type="text" 
          placeholder={placeholder} 
          value={item.name} 
          onChange={(e) => onUpdate(listName, item.id, 'name', e.target.value)} 
          className="w-full p-2 border rounded text-sm mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        
        <label className="text-xs font-bold text-gray-500 mb-1 block">Temperatura</label>
        {options ? (
          <select 
            value={item.temp} 
            onChange={(e) => onUpdate(listName, item.id, 'temp', e.target.value)} 
            className={`w-full p-2 border rounded text-sm bg-white ${item.isRisk ? 'border-red-500 text-red-600 font-bold' : ''}`}
          >
            <option value="">Seleccionar...</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input 
            type="text"
            placeholder="Ej. 65°C" 
            value={item.temp} 
            onChange={(e) => onUpdate(listName, item.id, 'temp', e.target.value)} 
            className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        )}

        {/* ALERTA VISUAL */}
        {showRiskAlert && item.isRisk && (
          <div className="mt-2 bg-red-100 border-l-4 border-red-500 text-red-700 p-2 text-xs flex items-start gap-2 animate-pulse">
            <AlertTriangle size={14} className="mt-0.5"/>
            <span>
              <strong>¡Cuidado!</strong> La temperatura no es la adecuada.
            </span>
          </div>
        )}
      </div>

      <div>
         <label className="text-xs font-bold text-gray-500 mb-1 block text-center">Evidencia Toma</label>
         {item.photo ? (
           <div className="relative">
              <img src={item.photo} className="w-full h-32 object-cover rounded border" alt="Evidencia" />
              <button onClick={() => onUpdate(listName, item.id, 'photo', null)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><Trash2 size={10}/></button>
           </div>
         ) : (
           <label className="w-full h-32 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
             <Camera className="text-gray-400"/>
             <span className="text-xs text-gray-400">Foto</span>
             <input type="file" className="hidden" accept="image/*" onChange={(e) => onPhotoUpload(e, listName, item.id)}/>
           </label>
         )}
      </div>
    </div>
    
    {/* Botón Eliminar */}
    <button onClick={() => onRemove(listName, item.id)} className="absolute -top-2 -right-2 bg-gray-200 hover:bg-red-500 hover:text-white text-gray-500 rounded-full p-1 shadow-md transition-colors z-10">
      <Trash2 size={14} />
    </button>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [view, setView] = useState('form'); 
  const [activeTab, setActiveTab] = useState('before');

  // --- ESTADO INICIAL ---
  const [formData, setFormData] = useState({
    unit: '', // Nuevo campo UNIDAD
    name: '',
    shift: 'Matutino',
    date: new Date().toISOString().split('T')[0],

    // A) ANTES DEL SERVICIO
    staffList: Array(15).fill(null).map((_, i) => ({
      id: i + 1, name: '', mask: true, uniform: true, shoes: true, hair: true, nails: true, jewelry: true, watch: true,
    })),
    photoStaffRegister: null,
    photoStaffUniform: null,
    handwashPhotos: [null, null, null],
    cleaningPhotos: [null, null, null, null],
    
    // Registros Antes
    photoSolutionRegister: null,
    retainers: [{ id: 1, photo: null }],
    photoChlorineRegister: null,
    photoChlorineMeasure: null,
    photoHoodRegister: null,
    photoHoodOperation: null,
    photoThermoAdjust: null,
    
    fridges: [1, 2, 3, 4].map(id => ({ id, photoEquipment: null, photoFood: null })),
    photoFridgeRegister: null,
    photoFreezerRegister: null,
    
    fvTime: '',
    fvPPM: '50',
    photoFvStrip: null,
    photoFvRegister: null,
    photoFvWash: null,
    photoFvDisinfect: null,

    // Cocción y Recalentado (DINÁMICOS)
    cookList: [{ id: 1, name: '', temp: '', photo: null }],
    photoCookRegister: null,
    
    reheatList: [{ id: 1, name: '', temp: '', photo: null }],
    photoReheatRegister: null,

    // B) DURANTE EL SERVICIO (DINÁMICOS Y LOGICA DE RIESGO)
    hotBarList: [{ id: 1, name: '', temp: '', photo: null, isRisk: false, wasCorrected: false }],
    photoHotBarRegister: null,

    coldBarList: [{ id: 1, name: '', temp: '', photo: null, isRisk: false, wasCorrected: false }],
    photoColdBarRegister: null,

    photoWitness: null,
    photoWitnessRegister: null,
    photoDishwasherTemp: null,
    photoDishwasherRegister: null,

    coolFood1: '',
    photoCoolFood1: null,
    coolFood2: '',
    photoCoolFood2: null,
    photoCoolRegister: null,

    // C) ENTREGA
    photoHandoverHotBar: null,
    photoHandoverColdBar: null,
    photoHandoverSalon: null,
    photoHandoverDry: null,
    photoHandoverChemicals: null,
    photoHandoverFridge: null,
    photoHandoverColdKitchen: null,
    photoHandoverHotKitchen: null,
    photoHandoverReception: null,
  });

  const hotTempOptions = ["Menor a 60°C", "61°C", "62°C", "63°C", "64°C", "65°C", "Mayor a 65°C"];
  const coldTempOptions = ["Menor a 4°C", "4°C", "5°C", "6°C", "Mayor a 7°C"];
  const ppmOptions = ["0", "50", "100", "150", "200"];

  // --- MANEJADORES ---

  // Función especial para manejar la impresión/descarga con nombre personalizado
  const handleDownloadPDF = () => {
    // 1. Definir el título del documento (esto será el nombre del archivo PDF sugerido)
    const fileName = `${formData.unit || 'Unidad'} - ${formData.date} - ${formData.shift}`;
    const originalTitle = document.title;
    document.title = fileName;

    // 2. Ejecutar impresión
    window.print();

    // 3. Restaurar título (opcional, por limpieza)
    // setTimeout(() => { document.title = originalTitle; }, 1000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStaffChange = (index, field, value) => {
    const newStaff = [...formData.staffList];
    newStaff[index][field] = value;
    setFormData(prev => ({ ...prev, staffList: newStaff }));
  };

  const handleFridgeChange = (index, field, value) => {
    const newFridges = [...formData.fridges];
    newFridges[index][field] = value;
    setFormData(prev => ({ ...prev, fridges: newFridges }));
  };

  const handleArrayPhoto = (e, arrayName, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newArray = [...formData[arrayName]];
        newArray[index] = reader.result;
        setFormData(prev => ({ ...prev, [arrayName]: newArray }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- MANEJO DE LISTAS DINÁMICAS ---

  const addListItem = (listName, template) => {
    setFormData(prev => ({
      ...prev,
      [listName]: [...prev[listName], { ...template, id: Date.now() }]
    }));
  };

  const removeListItem = (listName, id) => {
    setFormData(prev => ({
      ...prev,
      [listName]: prev[listName].filter(item => item.id !== id)
    }));
  };

  const updateListItem = (listName, id, field, value) => {
    setFormData(prev => {
      const newList = prev[listName].map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          if (listName === 'hotBarList' && field === 'temp') {
            const isRisk = value === "Menor a 60°C";
            if (isRisk) {
              updatedItem.isRisk = true;
            } else {
              if (item.isRisk) updatedItem.wasCorrected = true;
              updatedItem.isRisk = false;
            }
          }

          if (listName === 'coldBarList' && field === 'temp') {
            const isRisk = value === "Mayor a 7°C";
            if (isRisk) {
              updatedItem.isRisk = true;
            } else {
              if (item.isRisk) updatedItem.wasCorrected = true;
              updatedItem.isRisk = false;
            }
          }

          return updatedItem;
        }
        return item;
      });
      return { ...prev, [listName]: newList };
    });
  };

  const handleListPhoto = (e, listName, id) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateListItem(listName, id, 'photo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [fieldName]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (fieldName) => {
    setFormData(prev => ({ ...prev, [fieldName]: null }));
  };

  // --- VISTA REPORTE (PDF) ---
  if (view === 'report') {
    return (
      <div className="min-h-screen bg-gray-50 p-2 md:p-8 font-sans print:p-0 print:bg-white">
        <style>{`
          @media print {
            @page { margin: 10mm; size: auto; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-hidden { display: none !important; }
            .no-break { break-inside: avoid; }
          }
        `}</style>
        
        <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center print-hidden sticky top-0 bg-gray-50 z-10 py-4 border-b">
          <button onClick={() => setView('form')} className="flex items-center gap-2 text-gray-600 font-bold bg-white px-4 py-2 rounded-lg shadow-sm border">
            <ArrowLeft size={20} /> Editar
          </button>
          <div className="text-right flex items-center gap-4">
             <span className="text-xs text-gray-500 hidden md:inline">Nota: En celular, selecciona "Guardar en Archivos" o "Imprimir &gt; PDF"</span>
             <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 shadow-lg font-bold">
              <Download size={20} /> Descargar PDF
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto bg-white p-8 shadow-none print:w-full print:max-w-none text-xs md:text-sm">
          {/* Encabezado Reporte */}
          <div className="border-b-4 border-slate-800 pb-4 mb-6 flex justify-between items-end">
            <div className="flex items-center gap-4">
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyWozmpAYEGwL-xGkPyp0RlXSHXq-fNLKeJQ&s" 
                alt="Logo" 
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase">Bitácora Digital</h1>
                <p className="text-slate-500 font-semibold">Supervisión de la calidad</p>
                {formData.unit && <p className="text-lg font-bold text-blue-700 mt-1 uppercase">{formData.unit}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-500">FECHA</div>
              <div className="text-xl font-bold">{formData.date}</div>
              <div className="text-sm font-bold text-slate-500 mt-1">{formData.shift}</div>
              <div className="text-md font-semibold">{formData.name}</div>
            </div>
          </div>

          {/* A) ANTES DEL SERVICIO */}
          <div className="mb-8">
            <h3 className="bg-slate-800 text-white p-2 font-bold uppercase mb-4 print:bg-slate-800 print:text-white">- A) Antes del Servicio -</h3>
            
            {/* Personal Table */}
            <div className="mb-6 no-break">
              <h4 className="font-bold border-b mb-2">Personal</h4>
              <div className="flex gap-4 mb-4">
                 <div className="w-1/2">
                    {formData.photoStaffRegister ? <img src={formData.photoStaffRegister} className="w-full h-auto max-h-60 object-contain border bg-gray-50" alt="Reg" /> : <div className="h-32 border bg-gray-100 flex items-center justify-center">Sin foto registro</div>}
                    <p className="text-center italic text-gray-500">Registro Revisión</p>
                 </div>
                 <div className="w-1/2">
                    {formData.photoStaffUniform ? <img src={formData.photoStaffUniform} className="w-full h-auto max-h-60 object-contain border bg-gray-50" alt="Uni" /> : <div className="h-32 border bg-gray-100 flex items-center justify-center">Sin foto uniformes</div>}
                    <p className="text-center italic text-gray-500">Evidencia Uniformes</p>
                 </div>
              </div>
              <table className="w-full text-center border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-1">#</th>
                    <th className="border p-1 text-left">Nombre</th>
                    <th className="border p-1">Cubre B.</th>
                    <th className="border p-1">Unif.</th>
                    <th className="border p-1">Zapato</th>
                    <th className="border p-1">Cabello</th>
                    <th className="border p-1">Uña</th>
                    <th className="border p-1">Joyeria</th>
                    <th className="border p-1">Reloj</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.staffList.filter(s => s.name).map((staff) => (
                    <tr key={staff.id}>
                      <td className="border p-1">{staff.id}</td>
                      <td className="border p-1 text-left font-bold">{staff.name}</td>
                      <td className="border p-1">{staff.mask ? '✓' : ''}</td>
                      <td className="border p-1">{staff.uniform ? '✓' : ''}</td>
                      <td className="border p-1">{staff.shoes ? '✓' : ''}</td>
                      <td className="border p-1">{staff.hair ? '✓' : ''}</td>
                      <td className="border p-1">{staff.nails ? '✓' : ''}</td>
                      <td className="border p-1">{staff.jewelry ? '✓' : ''}</td>
                      <td className="border p-1">{staff.watch ? '✓' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grid de Fotos Pequeñas */}
            <div className="grid grid-cols-4 gap-2 mb-4 no-break">
              {formData.handwashPhotos.map((img, i) => (
                <div key={`hw-${i}`} className="border p-1">
                  <p className="text-[10px] font-bold text-center">Lavado Manos {i+1}</p>
                  {img ? <img src={img} className="w-full h-auto max-h-40 object-contain bg-gray-50" /> : <div className="h-20 bg-gray-50"></div>}
                </div>
              ))}
              {formData.cleaningPhotos.map((img, i) => (
                 <div key={`cl-${i}`} className="border p-1">
                 <p className="text-[10px] font-bold text-center">Limpieza Área {i+1}</p>
                 {img ? <img src={img} className="w-full h-auto max-h-40 object-contain bg-gray-50" /> : <div className="h-20 bg-gray-50"></div>}
               </div>
              ))}
            </div>

            {/* Apartados Separados */}
            <div className="grid grid-cols-2 gap-6 no-break">
              
              {/* Solución y Retenes */}
              <div className="col-span-2 border rounded p-3 bg-gray-50 print:bg-gray-100">
                <h4 className="font-bold text-sm mb-2 border-b border-gray-300 pb-1">Solución Desinfectante</h4>
                <div className="flex gap-4 overflow-x-auto pb-2 flex-wrap">
                   <div className="min-w-[150px] max-w-[200px]">
                      {formData.photoSolutionRegister ? <img src={formData.photoSolutionRegister} className="w-full h-auto max-h-40 object-contain border bg-white" /> : <div className="h-24 border bg-white flex items-center justify-center text-[10px]">Registro</div>}
                      <p className="text-[10px] text-center mt-1">Registro</p>
                   </div>
                   {formData.retainers.map((ret, i) => (
                     <div key={ret.id} className="min-w-[150px] max-w-[200px]">
                        {ret.photo ? <img src={ret.photo} className="w-full h-auto max-h-40 object-contain border bg-white" /> : <div className="h-24 border bg-white flex items-center justify-center text-[10px]">Evidencia</div>}
                        <p className="text-[10px] text-center mt-1">Retén {i + 1}</p>
                     </div>
                   ))}
                </div>
              </div>

              {/* Cloro */}
              <div className="border rounded p-3">
                 <h4 className="font-bold text-sm mb-2 border-b pb-1">Cloro Residual</h4>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                      {formData.photoChlorineRegister ? <img src={formData.photoChlorineRegister} className="w-full h-auto max-h-40 object-contain bg-gray-50" /> : <div className="h-24 bg-gray-100"></div>}
                      <p className="text-[10px] text-center mt-1">Registro</p>
                    </div>
                    <div>
                      {formData.photoChlorineMeasure ? <img src={formData.photoChlorineMeasure} className="w-full h-auto max-h-40 object-contain bg-gray-50" /> : <div className="h-24 bg-gray-100"></div>}
                      <p className="text-[10px] text-center mt-1">Medición</p>
                    </div>
                 </div>
              </div>

              {/* Campana */}
              <div className="border rounded p-3">
                 <h4 className="font-bold text-sm mb-2 border-b pb-1">Funcionamiento Campana</h4>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                      {formData.photoHoodRegister ? <img src={formData.photoHoodRegister} className="w-full h-auto max-h-40 object-contain bg-gray-50" /> : <div className="h-24 bg-gray-100"></div>}
                      <p className="text-[10px] text-center mt-1">Registro</p>
                    </div>
                    <div>
                      {formData.photoHoodOperation ? <img src={formData.photoHoodOperation} className="w-full h-auto max-h-40 object-contain bg-gray-50" /> : <div className="h-24 bg-gray-100"></div>}
                      <p className="text-[10px] text-center mt-1">Funcionamiento</p>
                    </div>
                 </div>
              </div>

              {/* Termómetro */}
              <div className="border rounded p-3">
                 <h4 className="font-bold text-sm mb-2 border-b pb-1">Ajuste de Termómetro</h4>
                 <div>
                    {formData.photoThermoAdjust ? <img src={formData.photoThermoAdjust} className="w-full h-auto max-h-40 object-contain mx-auto bg-gray-50" /> : <div className="h-24 bg-gray-100"></div>}
                    <p className="text-[10px] text-center mt-1">Evidencia Ajuste</p>
                 </div>
              </div>
            </div>


            {/* Refrigeración */}
            <div className="mt-6 mb-6 no-break">
              <h4 className="font-bold border-b mb-2">Refrigeración y Congelación</h4>
              <div className="grid grid-cols-4 gap-2 mb-2">
                 {formData.fridges.map(f => (
                   <div key={f.id} className="border p-1 text-center bg-blue-50 print:bg-blue-50">
                     <p className="font-bold text-[10px]">Equipo {f.id}</p>
                     <div className="h-24 mb-1 bg-white">{f.photoEquipment && <img src={f.photoEquipment} className="w-full h-full object-contain"/>}</div>
                     <div className="h-24 bg-white">{f.photoFood && <img src={f.photoFood} className="w-full h-full object-contain"/>}</div>
                   </div>
                 ))}
              </div>
              <div className="flex gap-4">
                 <div className="w-1/2 border p-2 flex items-center gap-2">
                    <div className="font-bold text-xs">Registro Refrig.</div>
                    {formData.photoFridgeRegister && <img src={formData.photoFridgeRegister} className="h-24 w-auto object-contain ml-auto"/>}
                 </div>
                 <div className="w-1/2 border p-2 flex items-center gap-2">
                    <div className="font-bold text-xs">Registro Congel.</div>
                    {formData.photoFreezerRegister && <img src={formData.photoFreezerRegister} className="h-24 w-auto object-contain ml-auto"/>}
                 </div>
              </div>
            </div>

            {/* Frutas, Verduras, Cocción, Recalentado */}
            <div className="grid grid-cols-2 gap-6 mb-6 no-break">
              
              {/* Frutas y Verduras */}
              <div className="border p-3">
                <h4 className="font-bold text-xs mb-2 uppercase text-green-700">Frutas y Verduras</h4>
                <div className="flex justify-between text-xs mb-2 font-mono bg-gray-100 p-1">
                  <span>Hora: {formData.fvTime}</span>
                  <span>PPM: {formData.fvPPM}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   {formData.photoFvStrip && <img src={formData.photoFvStrip} className="w-full h-auto max-h-40 object-contain bg-gray-50"/>}
                   {formData.photoFvRegister && <img src={formData.photoFvRegister} className="w-full h-auto max-h-40 object-contain bg-gray-50"/>}
                   {formData.photoFvWash && <img src={formData.photoFvWash} className="w-full h-auto max-h-40 object-contain bg-gray-50"/>}
                   {formData.photoFvDisinfect && <img src={formData.photoFvDisinfect} className="w-full h-auto max-h-40 object-contain bg-gray-50"/>}
                </div>
              </div>

              {/* Cocción y Recalentado (Separados) */}
              <div className="space-y-4">
                 
                 {/* Cuadro Cocción */}
                 <div className="border border-orange-200 bg-orange-50 print:bg-orange-50 p-4 rounded-lg shadow-sm">
                   <h3 className="font-bold text-orange-800 mb-3 uppercase text-sm flex justify-between">
                     Cocción
                   </h3>
                   <div className="space-y-4 mb-4">
                      {formData.cookList.map((item, idx) => (
                         <div key={item.id} className="flex justify-between items-start border-b border-orange-200 pb-2">
                            <div className="w-1/2 pr-2">
                               <p className="text-[10px] font-bold">{item.name || `Alimento ${idx + 1}`}</p>
                               <p className="text-[10px]">Temp: {item.temp}</p>
                            </div>
                            <div className="w-1/2">
                               {item.photo ? <img src={item.photo} className="w-full h-auto max-h-32 object-contain bg-white border" /> : <div className="text-[9px] text-gray-400">Sin foto</div>}
                            </div>
                         </div>
                      ))}
                   </div>
                   <div className="text-center">
                     <p className="text-[9px] font-bold">Registro Temp. Cocción</p>
                     {formData.photoCookRegister && <img src={formData.photoCookRegister} className="w-full h-auto max-h-40 object-contain mt-1 border bg-white"/>}
                   </div>
                 </div>

                 {/* Cuadro Recalentado */}
                 <div className="border border-yellow-200 bg-yellow-50 print:bg-yellow-50 p-4 rounded-lg shadow-sm">
                   <h3 className="font-bold text-yellow-800 mb-3 uppercase text-sm flex justify-between">
                     Recalentado
                   </h3>
                   <div className="space-y-4 mb-4">
                      {formData.reheatList.map((item, idx) => (
                         <div key={item.id} className="flex justify-between items-start border-b border-yellow-200 pb-2">
                            <div className="w-1/2 pr-2">
                               <p className="text-[10px] font-bold">{item.name || `Alimento ${idx + 1}`}</p>
                               <p className="text-[10px]">Temp: {item.temp}</p>
                            </div>
                            <div className="w-1/2">
                               {item.photo ? <img src={item.photo} className="w-full h-auto max-h-32 object-contain bg-white border" /> : <div className="text-[9px] text-gray-400">Sin foto</div>}
                            </div>
                         </div>
                      ))}
                   </div>
                   <div className="text-center">
                     <p className="text-[9px] font-bold">Registro Temp. Recalentado</p>
                     {formData.photoReheatRegister && <img src={formData.photoReheatRegister} className="w-full h-auto max-h-40 object-contain mt-1 border bg-white"/>}
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* B) DURANTE EL SERVICIO */}
          <div className="mb-8 no-break">
             <h3 className="bg-slate-800 text-white p-2 font-bold uppercase mb-4 print:bg-slate-800 print:text-white">- B) Durante el Servicio -</h3>
             
             <div className="grid grid-cols-2 gap-4 text-[10px]">
                
                {/* Temperatura Barra Caliente */}
                <div className="border p-2 bg-orange-50 print:bg-orange-50">
                   <p className="font-bold uppercase text-orange-800 text-sm mb-4 border-b border-orange-200 pb-2">Temperatura Barra Caliente</p>
                   
                   {/* Lista de Alimentos */}
                   <div className="space-y-4 mb-6">
                     {formData.hotBarList.map(item => (
                       <div key={item.id} className="flex gap-2 border-b border-orange-200 pb-2">
                          <div className="w-1/2 flex flex-col justify-center">
                             <p className="font-bold text-xs mb-1">{item.name || 'Sin nombre'}</p>
                             <p className="font-mono text-lg font-bold">{item.temp || '--'}</p>
                             {/* Advertencias en Reporte */}
                             {item.isRisk && <p className="text-red-600 font-bold bg-red-100 p-1 mt-1 rounded text-[9px] text-center border border-red-300">FUERA DE ZPT</p>}
                             {item.wasCorrected && !item.isRisk && <p className="text-orange-600 font-bold bg-orange-100 p-1 mt-1 rounded text-[9px] text-center border border-orange-300">Hubo modificación en temperatura</p>}
                          </div>
                          <div className="w-1/2">
                             <p className="text-[9px] text-center mb-1 text-gray-500">Toma</p>
                             {item.photo ? <img src={item.photo} className="w-full h-auto max-h-40 object-contain bg-white border"/> : <div className="h-20 bg-white border flex items-center justify-center text-gray-300">Sin foto</div>}
                          </div>
                       </div>
                     ))}
                   </div>

                   {/* Registro General */}
                   <div className="mt-4 border-t border-orange-200 pt-2">
                       <p className="text-[10px] text-center font-bold mb-1">Registro General Barra Caliente</p>
                       {formData.photoHotBarRegister ? <img src={formData.photoHotBarRegister} className="w-full h-auto max-h-48 object-contain bg-white border"/> : <div className="h-24 bg-white border flex items-center justify-center text-gray-300">Sin Registro</div>}
                   </div>
                </div>

                {/* Temperatura Barra Fría */}
                <div className="border p-2 bg-blue-50 print:bg-blue-50">
                   <p className="font-bold uppercase text-blue-800 text-sm mb-4 border-b border-blue-200 pb-2">Temperatura Barra Fría</p>
                   
                   {/* Lista de Alimentos */}
                   <div className="space-y-4 mb-6">
                     {formData.coldBarList.map(item => (
                       <div key={item.id} className="flex gap-2 border-b border-blue-200 pb-2">
                          <div className="w-1/2 flex flex-col justify-center">
                             <p className="font-bold text-xs mb-1">{item.name || 'Sin nombre'}</p>
                             <p className="font-mono text-lg font-bold">{item.temp || '--'}</p>
                             {/* Advertencias en Reporte */}
                             {item.isRisk && <p className="text-red-600 font-bold bg-red-100 p-1 mt-1 rounded text-[9px] text-center border border-red-300">FUERA DE ZPT</p>}
                             {item.wasCorrected && !item.isRisk && <p className="text-orange-600 font-bold bg-orange-100 p-1 mt-1 rounded text-[9px] text-center border border-orange-300">Hubo modificación en temperatura</p>}
                          </div>
                          <div className="w-1/2">
                             <p className="text-[9px] text-center mb-1 text-gray-500">Toma</p>
                             {item.photo ? <img src={item.photo} className="w-full h-auto max-h-40 object-contain bg-white border"/> : <div className="h-20 bg-white border flex items-center justify-center text-gray-300">Sin foto</div>}
                          </div>
                       </div>
                     ))}
                   </div>

                   {/* Registro General */}
                   <div className="mt-4 border-t border-blue-200 pt-2">
                       <p className="text-[10px] text-center font-bold mb-1">Registro General Barra Fría</p>
                       {formData.photoColdBarRegister ? <img src={formData.photoColdBarRegister} className="w-full h-auto max-h-48 object-contain bg-white border"/> : <div className="h-24 bg-white border flex items-center justify-center text-gray-300">Sin Registro</div>}
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-4 text-[10px]">
                {/* Muestras Testigo */}
                <div className="border p-3">
                   <p className="font-bold text-sm mb-2">Muestras Testigo</p>
                   <div className="flex gap-2">
                     <div className="flex-1">
                       <p className="text-[9px] text-center">Evidencia</p>
                       {formData.photoWitness ? <img src={formData.photoWitness} className="w-full h-auto max-h-40 object-contain bg-gray-50"/> : <div className="h-20 bg-gray-50 border"></div>}
                     </div>
                     <div className="flex-1">
                       <p className="text-[9px] text-center">Registro</p>
                       {formData.photoWitnessRegister ? <img src={formData.photoWitnessRegister} className="w-full h-auto max-h-40 object-contain bg-gray-50"/> : <div className="h-20 bg-gray-50 border"></div>}
                     </div>
                   </div>
                </div>

                {/* Lavaloza */}
                <div className="border p-3">
                   <p className="font-bold text-sm mb-2">Máquina Lavaloza</p>
                   <div className="flex gap-2">
                     <div className="flex-1">
                       <p className="text-[9px] text-center">Evidencia</p>
                       {formData.photoDishwasherTemp ? <img src={formData.photoDishwasherTemp} className="w-full h-auto max-h-40 object-contain bg-gray-50"/> : <div className="h-20 bg-gray-50 border"></div>}
                     </div>
                     <div className="flex-1">
                       <p className="text-[9px] text-center">Registro</p>
                       {formData.photoDishwasherRegister ? <img src={formData.photoDishwasherRegister} className="w-full h-auto max-h-40 object-contain bg-gray-50"/> : <div className="h-20 bg-gray-50 border"></div>}
                     </div>
                   </div>
                </div>
             </div>

             <div className="mt-4 border p-2 bg-gray-50 print:bg-gray-100">
               <p className="font-bold text-xs mb-2">Enfriamiento de Alimentos</p>
               <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="block font-bold text-[10px]">{formData.coolFood1}</span>
                    {formData.photoCoolFood1 && <img src={formData.photoCoolFood1} className="w-full h-auto max-h-40 object-contain"/>}
                  </div>
                  <div>
                    <span className="block font-bold text-[10px]">{formData.coolFood2}</span>
                    {formData.photoCoolFood2 && <img src={formData.photoCoolFood2} className="w-full h-auto max-h-40 object-contain"/>}
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-[10px]">Registro</span>
                    {formData.photoCoolRegister && <img src={formData.photoCoolRegister} className="w-full h-auto max-h-40 object-contain"/>}
                  </div>
               </div>
             </div>
          </div>

          {/* C) ENTREGA DE TURNO */}
          <div className="no-break">
             <h3 className="bg-slate-800 text-white p-2 font-bold uppercase mb-4 print:bg-slate-800 print:text-white">- C) Entrega de Turno -</h3>
             <div className="grid grid-cols-5 gap-2">
                {[
                  {l: 'B. Caliente', i: formData.photoHandoverHotBar},
                  {l: 'B. Fría', i: formData.photoHandoverColdBar},
                  {l: 'Salón', i: formData.photoHandoverSalon},
                  {l: 'Secos', i: formData.photoHandoverDry},
                  {l: 'Químicos', i: formData.photoHandoverChemicals},
                  {l: 'Refrig.', i: formData.photoHandoverFridge},
                  {l: 'Coc. Fría', i: formData.photoHandoverColdKitchen},
                  {l: 'Coc. Caliente', i: formData.photoHandoverHotKitchen},
                  {l: 'Recepción', i: formData.photoHandoverReception},
                ].map((item, idx) => (
                  <div key={idx} className="border p-1 text-center">
                     <p className="text-[9px] font-bold mb-1">{item.l}</p>
                     {item.i ? <img src={item.i} className="w-full h-auto max-h-40 object-contain bg-gray-50"/> : <div className="h-16 bg-gray-50"></div>}
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    );
  }

  // --- VISTA FORMULARIO ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      <div className="max-w-3xl mx-auto px-4 pt-6">
        
        {/* Header App */}
        <header className="mb-6 flex items-center gap-4">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyWozmpAYEGwL-xGkPyp0RlXSHXq-fNLKeJQ&s" 
            alt="Logo" 
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-lg"
          />
          <div>
            <h1 className="text-2xl font-black text-slate-800 leading-none">Bitácora Digital</h1>
            <p className="text-sm text-slate-500 font-medium">Supervisión de la calidad</p>
          </div>
        </header>

        {/* Datos Principales (Unidad, Nombre, Turno, Fecha) */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-slate-200 gap-3 flex flex-col">
            
            {/* Campo UNIDAD Arriba */}
            <div className="w-full">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Unidad / Sucursal</label>
              <div className="relative">
                 <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                 <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} placeholder="Escribe el nombre de la unidad..." className="w-full pl-10 p-2 bg-slate-50 border rounded text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none uppercase"/>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Responsable" className="w-full p-2 bg-slate-50 border rounded text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"/>
              <select name="shift" value={formData.shift} onChange={handleInputChange} className="w-full p-2 bg-slate-50 border rounded text-sm">
                <option>Matutino</option><option>Vespertino</option><option>Mixto</option>
              </select>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full p-2 bg-slate-50 border rounded text-sm md:col-span-1 col-span-2"/>
            </div>
        </div>

        {/* Navegación */}
        <div className="flex rounded-xl bg-white p-1 shadow-sm border border-slate-200 mb-6 sticky top-2 z-20">
          <button onClick={() => setActiveTab('before')} className={`flex-1 py-3 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'before' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>A) ANTES</button>
          <button onClick={() => setActiveTab('during')} className={`flex-1 py-3 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'during' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>B) DURANTE</button>
          <button onClick={() => setActiveTab('after')} className={`flex-1 py-3 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'after' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>C) ENTREGA</button>
        </div>

        {/* --- FORM CONTENIDO --- */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 md:p-6 mb-8">
          
          {/* SECCIÓN A: ANTES */}
          {activeTab === 'before' && (
            <div className="animate-in fade-in duration-300">
              
              <SectionTitle title="Personal" icon={Users} />
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <ImageUploader label="Foto Registro Revisión" fieldName="photoStaffRegister" value={formData.photoStaffRegister} onUpload={handleImageUpload} onRemove={removeImage} compact />
                <ImageUploader label="Foto Grupo Uniforme" fieldName="photoStaffUniform" value={formData.photoStaffUniform} onUpload={handleImageUpload} onRemove={removeImage} compact />
              </div>

              <div className="overflow-x-auto mb-8 border rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 text-gray-600 uppercase">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2 min-w-[120px]">Nombre</th>
                      <th className="p-2 text-center">Cubre B.</th>
                      <th className="p-2 text-center">Unif.</th>
                      <th className="p-2 text-center">Zapato</th>
                      <th className="p-2 text-center">Cabello</th>
                      <th className="p-2 text-center">Uña</th>
                      <th className="p-2 text-center">Joyeria</th>
                      <th className="p-2 text-center">Reloj</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {formData.staffList.map((staff, i) => (
                      <tr key={staff.id}>
                        <td className="p-2 font-bold text-gray-400">{staff.id}</td>
                        <td className="p-2"><input type="text" placeholder="Nombre..." className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none" value={staff.name} onChange={(e) => handleStaffChange(i, 'name', e.target.value)} /></td>
                        <td className="p-2 text-center"><input type="checkbox" checked={staff.mask} onChange={(e) => handleStaffChange(i, 'mask', e.target.checked)} /></td>
                        <td className="p-2 text-center"><input type="checkbox" checked={staff.uniform} onChange={(e) => handleStaffChange(i, 'uniform', e.target.checked)} /></td>
                        <td className="p-2 text-center"><input type="checkbox" checked={staff.shoes} onChange={(e) => handleStaffChange(i, 'shoes', e.target.checked)} /></td>
                        <td className="p-2 text-center"><input type="checkbox" checked={staff.hair} onChange={(e) => handleStaffChange(i, 'hair', e.target.checked)} /></td>
                        <td className="p-2 text-center"><input type="checkbox" checked={staff.nails} onChange={(e) => handleStaffChange(i, 'nails', e.target.checked)} /></td>
                        <td className="p-2 text-center"><input type="checkbox" checked={staff.jewelry} onChange={(e) => handleStaffChange(i, 'jewelry', e.target.checked)} /></td>
                        <td className="p-2 text-center"><input type="checkbox" checked={staff.watch} onChange={(e) => handleStaffChange(i, 'watch', e.target.checked)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <SectionTitle title="Lavado Manos (3)" icon={Droplets} />
              <div className="grid grid-cols-3 gap-2">
                {[0,1,2].map(i => (
                  <label key={i} className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 relative overflow-hidden">
                    {formData.handwashPhotos[i] ? <img src={formData.handwashPhotos[i]} className="w-full h-full object-cover"/> : <Camera className="text-gray-300"/>}
                    <input type="file" className="hidden" onChange={(e) => handleArrayPhoto(e, 'handwashPhotos', i)} accept="image/*" />
                  </label>
                ))}
              </div>

              <SectionTitle title="Limpieza Áreas (4)" icon={Droplets} />
              <div className="grid grid-cols-4 gap-2">
                {[0,1,2,3].map(i => (
                  <label key={i} className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 relative overflow-hidden">
                    {formData.cleaningPhotos[i] ? <img src={formData.cleaningPhotos[i]} className="w-full h-full object-cover"/> : <Camera className="text-gray-300"/>}
                    <input type="file" className="hidden" onChange={(e) => handleArrayPhoto(e, 'cleaningPhotos', i)} accept="image/*" />
                  </label>
                ))}
              </div>

              {/* SECCIÓN SOLUCIÓN DESINFECTANTE */}
              <SectionTitle title="Solución Desinfectante" />
              <div className="mb-8">
                 <ImageUploader label="Foto Registro Solución" fieldName="photoSolutionRegister" value={formData.photoSolutionRegister} onUpload={handleImageUpload} onRemove={removeImage} />
                 
                 <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-gray-700">Fotografía de Retenes</h4>
                      <button onClick={() => addListItem('retainers', { photo: null })} className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                        <Plus size={14}/> Agregar Retén
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.retainers.map((ret, idx) => (
                        <div key={ret.id} className="relative">
                           <label className="aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white bg-gray-100 relative overflow-hidden">
                             {ret.photo ? <img src={ret.photo} className="w-full h-full object-cover"/> : <><Camera className="text-gray-400 mb-1"/><span className="text-xs text-gray-500">Retén {idx + 1}</span></>}
                             <input type="file" className="hidden" onChange={(e) => handleListPhoto(e, 'retainers', ret.id)} accept="image/*" />
                           </label>
                           {formData.retainers.length > 1 && (
                             <button onClick={() => removeListItem('retainers', ret.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow"><Trash2 size={12}/></button>
                           )}
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              {/* CLORO */}
              <SectionTitle title="Cloro Residual" />
              <div className="grid grid-cols-2 gap-4">
                 <ImageUploader label="Registro Cloro" fieldName="photoChlorineRegister" value={formData.photoChlorineRegister} onUpload={handleImageUpload} onRemove={removeImage} compact />
                 <ImageUploader label="Medición Cloro" fieldName="photoChlorineMeasure" value={formData.photoChlorineMeasure} onUpload={handleImageUpload} onRemove={removeImage} compact />
              </div>

              {/* CAMPANA */}
              <SectionTitle title="Funcionamiento Campana" />
              <div className="grid grid-cols-2 gap-4">
                 <ImageUploader label="Registro Campana" fieldName="photoHoodRegister" value={formData.photoHoodRegister} onUpload={handleImageUpload} onRemove={removeImage} compact />
                 <ImageUploader label="Funcionamiento" fieldName="photoHoodOperation" value={formData.photoHoodOperation} onUpload={handleImageUpload} onRemove={removeImage} compact />
              </div>

              {/* TERMÓMETRO */}
              <SectionTitle title="Ajuste de Termómetro" />
              <ImageUploader label="Evidencia Ajuste" fieldName="photoThermoAdjust" value={formData.photoThermoAdjust} onUpload={handleImageUpload} onRemove={removeImage} />


              <SectionTitle title="Refrigeración" icon={Snowflake} />
              <div className="space-y-4 mb-4">
                {formData.fridges.map((f, i) => (
                   <div key={f.id} className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2 items-center">
                      <span className="font-bold text-blue-800 w-8 text-center">{f.id}</span>
                      <label className="flex-1 h-20 bg-white border border-dashed rounded flex items-center justify-center text-xs text-gray-400 cursor-pointer overflow-hidden relative">
                        {f.photoEquipment ? <img src={f.photoEquipment} className="w-full h-full object-cover"/> : 'Foto Equipo'}
                        <input type="file" className="hidden" onChange={(e) => {
                           const file = e.target.files[0];
                           if(file) {
                             const reader = new FileReader();
                             reader.onloadend = () => handleFridgeChange(i, 'photoEquipment', reader.result);
                             reader.readAsDataURL(file);
                           }
                        }}/>
                      </label>
                      <label className="flex-1 h-20 bg-white border border-dashed rounded flex items-center justify-center text-xs text-gray-400 cursor-pointer overflow-hidden relative">
                        {f.photoFood ? <img src={f.photoFood} className="w-full h-full object-cover"/> : 'Foto Alimento'}
                        <input type="file" className="hidden" onChange={(e) => {
                           const file = e.target.files[0];
                           if(file) {
                             const reader = new FileReader();
                             reader.onloadend = () => handleFridgeChange(i, 'photoFood', reader.result);
                             reader.readAsDataURL(file);
                           }
                        }}/>
                      </label>
                   </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                   <ImageUploader label="Reg. Refrigeración" fieldName="photoFridgeRegister" value={formData.photoFridgeRegister} onUpload={handleImageUpload} onRemove={removeImage} compact />
                   <ImageUploader label="Reg. Congelación" fieldName="photoFreezerRegister" value={formData.photoFreezerRegister} onUpload={handleImageUpload} onRemove={removeImage} compact />
                </div>
              </div>

              <SectionTitle title="Frutas y Verduras" />
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                 <div className="flex gap-4 mb-4">
                   <div className="w-1/2">
                     <label className="text-xs font-bold text-green-800">Hora</label>
                     <input type="time" name="fvTime" value={formData.fvTime} onChange={handleInputChange} className="w-full p-2 rounded border" />
                   </div>
                   <div className="w-1/2">
                     <label className="text-xs font-bold text-green-800">PPM</label>
                     <select name="fvPPM" value={formData.fvPPM} onChange={handleInputChange} className="w-full p-2 rounded border">
                       {ppmOptions.map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <ImageUploader label="Tira Reactiva" fieldName="photoFvStrip" value={formData.photoFvStrip} onUpload={handleImageUpload} onRemove={removeImage} compact />
                    <ImageUploader label="Registro" fieldName="photoFvRegister" value={formData.photoFvRegister} onUpload={handleImageUpload} onRemove={removeImage} compact />
                    <ImageUploader label="Ev. Lavado" fieldName="photoFvWash" value={formData.photoFvWash} onUpload={handleImageUpload} onRemove={removeImage} compact />
                    <ImageUploader label="Ev. Desinfección" fieldName="photoFvDisinfect" value={formData.photoFvDisinfect} onUpload={handleImageUpload} onRemove={removeImage} compact />
                 </div>
              </div>

              <SectionTitle title="Cocción y Recalentado" icon={Flame} />
              <div className="space-y-6">
                
                {/* Cuadro Cocción */}
                <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg shadow-sm">
                   <h3 className="font-bold text-orange-800 mb-3 uppercase text-sm flex justify-between">
                     Cocción
                     <button onClick={() => addListItem('cookList', { name: '', temp: '', photo: null })} className="text-[10px] bg-orange-600 text-white px-2 py-1 rounded flex items-center gap-1">
                        <Plus size={12}/> Agregar Alimento
                     </button>
                   </h3>
                   {formData.cookList.map(item => (
                      <DynamicItem key={item.id} item={item} listName="cookList" placeholder="Nombre Alimento Cocción" onUpdate={updateListItem} onRemove={removeListItem} onPhotoUpload={handleListPhoto} />
                   ))}
                   <ImageUploader label="Registro Temp. Cocción" fieldName="photoCookRegister" value={formData.photoCookRegister} onUpload={handleImageUpload} onRemove={removeImage} compact />
                </div>

                {/* Cuadro Recalentado */}
                <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg shadow-sm">
                   <h3 className="font-bold text-yellow-800 mb-3 uppercase text-sm flex justify-between">
                     Recalentado
                     <button onClick={() => addListItem('reheatList', { name: '', temp: '', photo: null })} className="text-[10px] bg-yellow-600 text-white px-2 py-1 rounded flex items-center gap-1">
                        <Plus size={12}/> Agregar Alimento
                     </button>
                   </h3>
                   {formData.reheatList.map(item => (
                      <DynamicItem key={item.id} item={item} listName="reheatList" placeholder="Nombre Alimento Recalentado" onUpdate={updateListItem} onRemove={removeListItem} onPhotoUpload={handleListPhoto} />
                   ))}
                   <ImageUploader label="Registro Temp. Recalentado" fieldName="photoReheatRegister" value={formData.photoReheatRegister} onUpload={handleImageUpload} onRemove={removeImage} compact />
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN B: DURANTE */}
          {activeTab === 'during' && (
             <div className="animate-in fade-in duration-300">
                
                {/* BARRA CALIENTE */}
                <SectionTitle title="Temperatura Barra Caliente" icon={Thermometer} />
                <div className="bg-orange-50 p-4 rounded-lg mb-6 border border-orange-100">
                   <div className="flex justify-end mb-2">
                     <button onClick={() => addListItem('hotBarList', { name: '', temp: '', photo: null, isRisk: false, wasCorrected: false })} className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold shadow-sm hover:bg-orange-700">
                        <Plus size={14}/> Agregar Alimento
                     </button>
                   </div>
                   
                   {formData.hotBarList.map(item => (
                      <DynamicItem 
                        key={item.id} 
                        item={item} 
                        listName="hotBarList" 
                        placeholder="Nombre Alimento Caliente" 
                        options={hotTempOptions}
                        showRiskAlert={true}
                        onUpdate={updateListItem} onRemove={removeListItem} onPhotoUpload={handleListPhoto}
                      />
                   ))}

                   <div className="mt-4 border-t pt-4 border-orange-200">
                      <ImageUploader label="Registro General Barra Caliente" fieldName="photoHotBarRegister" value={formData.photoHotBarRegister} onUpload={handleImageUpload} onRemove={removeImage} />
                   </div>
                </div>

                {/* BARRA FRÍA */}
                <SectionTitle title="Temperatura Barra Fría" icon={Thermometer} />
                <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                   <div className="flex justify-end mb-2">
                     <button onClick={() => addListItem('coldBarList', { name: '', temp: '', photo: null, isRisk: false, wasCorrected: false })} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold shadow-sm hover:bg-blue-700">
                        <Plus size={14}/> Agregar Alimento
                     </button>
                   </div>
                   
                   {formData.coldBarList.map(item => (
                      <DynamicItem 
                        key={item.id} 
                        item={item} 
                        listName="coldBarList" 
                        placeholder="Nombre Alimento Frío" 
                        options={coldTempOptions}
                        showRiskAlert={true}
                        onUpdate={updateListItem} onRemove={removeListItem} onPhotoUpload={handleListPhoto}
                      />
                   ))}

                   <div className="mt-4 border-t pt-4 border-blue-200">
                      <ImageUploader label="Registro General Barra Fría" fieldName="photoColdBarRegister" value={formData.photoColdBarRegister} onUpload={handleImageUpload} onRemove={removeImage} />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                   <div className="p-4 border rounded shadow-sm bg-white">
                      <SectionTitle title="Muestras Testigo" />
                      <div className="grid grid-cols-2 gap-2">
                        <ImageUploader label="Evidencia" fieldName="photoWitness" value={formData.photoWitness} onUpload={handleImageUpload} onRemove={removeImage} compact />
                        <ImageUploader label="Registro" fieldName="photoWitnessRegister" value={formData.photoWitnessRegister} onUpload={handleImageUpload} onRemove={removeImage} compact />
                      </div>
                   </div>

                   <div className="p-4 border rounded shadow-sm bg-white">
                      <SectionTitle title="Máquina Lavaloza" />
                      <div className="grid grid-cols-2 gap-2">
                        <ImageUploader label="Evidencia" fieldName="photoDishwasherTemp" value={formData.photoDishwasherTemp} onUpload={handleImageUpload} onRemove={removeImage} compact />
                        <ImageUploader label="Registro" fieldName="photoDishwasherRegister" value={formData.photoDishwasherRegister} onUpload={handleImageUpload} onRemove={removeImage} compact />
                      </div>
                   </div>
                </div>

                <SectionTitle title="Enfriamiento" icon={Snowflake} />
                <div className="p-4 border rounded bg-gray-50">
                   <input type="text" name="coolFood1" placeholder="Alimento 1" value={formData.coolFood1} onChange={handleInputChange} className="w-full p-2 border rounded mb-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                   <ImageUploader label="Toma Temp 1" fieldName="photoCoolFood1" value={formData.photoCoolFood1} onUpload={handleImageUpload} onRemove={removeImage} compact />
                   
                   <input type="text" name="coolFood2" placeholder="Alimento 2" value={formData.coolFood2} onChange={handleInputChange} className="w-full p-2 border rounded mb-2 text-sm mt-4 focus:ring-2 focus:ring-blue-500 outline-none" />
                   <ImageUploader label="Toma Temp 2" fieldName="photoCoolFood2" value={formData.photoCoolFood2} onUpload={handleImageUpload} onRemove={removeImage} compact />

                   <div className="mt-4">
                      <ImageUploader label="Reg. Enfriamiento" fieldName="photoCoolRegister" value={formData.photoCoolRegister} onUpload={handleImageUpload} onRemove={removeImage} compact />
                   </div>
                </div>
             </div>
          )}

          {/* SECCIÓN C: ENTREGA */}
          {activeTab === 'after' && (
             <div className="animate-in fade-in duration-300">
                <SectionTitle title="Entrega de Turno" icon={CheckCircle} />
                <p className="text-sm text-gray-500 mb-4">Adjuntar evidencias fotográficas por área.</p>
                <div className="grid grid-cols-2 gap-3">
                   <ImageUploader label="1. Barra Caliente" fieldName="photoHandoverHotBar" value={formData.photoHandoverHotBar} onUpload={handleImageUpload} onRemove={removeImage} compact />
                   <ImageUploader label="2. Barra Fría" fieldName="photoHandoverColdBar" value={formData.photoHandoverColdBar} onUpload={handleImageUpload} onRemove={removeImage} compact />
                   <ImageUploader label="3. Salón" fieldName="photoHandoverSalon" value={formData.photoHandoverSalon} onUpload={handleImageUpload} onRemove={removeImage} compact />
                   <ImageUploader label="4. Almacén Secos" fieldName="photoHandoverDry" value={formData.photoHandoverDry} onUpload={handleImageUpload} onRemove={removeImage} compact />
                   <ImageUploader label="5. Alm. Químicos" fieldName="photoHandoverChemicals" value={formData.photoHandoverChemicals} onUpload={handleImageUpload} onRemove={removeImage} compact />
                   <ImageUploader label="6. Cámara Refrig." fieldName="photoHandoverFridge" value={formData.photoHandoverFridge} onUpload={handleImageUpload} onRemove={removeImage} compact />
                   <ImageUploader label="7. Cocina Fría" fieldName="photoHandoverColdKitchen" value={formData.photoHandoverColdKitchen} onUpload={handleImageUpload} onRemove={removeImage} compact />
                   <ImageUploader label="8. Cocina Caliente" fieldName="photoHandoverHotKitchen" value={formData.photoHandoverHotKitchen} onUpload={handleImageUpload} onRemove={removeImage} compact />
                   <ImageUploader label="9. Recepción" fieldName="photoHandoverReception" value={formData.photoHandoverReception} onUpload={handleImageUpload} onRemove={removeImage} compact />
                </div>
             </div>
          )}
          
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => setView('report')}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-4 rounded-full shadow-xl hover:bg-green-700 hover:scale-105 transition-all font-bold text-lg"
          >
            <FileText size={24} /> Generar Reporte PDF
          </button>
        </div>

      </div>
    </div>
  );
}