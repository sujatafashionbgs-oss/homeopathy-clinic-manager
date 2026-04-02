import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMedicineMasterStore } from "../store/medicineMasterStore";

export interface HomeoMedicine {
  id: number;
  name: string;
  category: string;
  usage: string;
  potency: string;
  unit: string;
  company: string;
}

export const HOMEO_MEDICINES: HomeoMedicine[] = [
  {
    id: 1,
    name: "Arnica Montana",
    category: "Plants",
    usage: "चोट, दर्द, सूजन, थकान",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 2,
    name: "Belladonna",
    category: "Plants",
    usage: "तेज बुखार, सिरदर्द, गले में दर्द",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 3,
    name: "Nux Vomica",
    category: "Plants",
    usage: "अपच, कब्ज, चिड़चिड़ापन, पेट दर्द",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 4,
    name: "Pulsatilla",
    category: "Plants",
    usage: "सर्दी, कान दर्द, मासिक धर्म, भावुकता",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 5,
    name: "Sulphur",
    category: "Minerals",
    usage: "त्वचा रोग, खुजली, दाद, एक्जिमा",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 6,
    name: "Rhus Toxicodendron",
    category: "Plants",
    usage: "जोड़ों का दर्द, मोच, त्वचा पर चकत्ते",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 7,
    name: "Bryonia Alba",
    category: "Plants",
    usage: "खांसी, जोड़ों का दर्द, सिरदर्द",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 8,
    name: "Lycopodium Clavatum",
    category: "Plants",
    usage: "पाचन विकार, कमजोरी, किडनी पथरी",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 9,
    name: "Calcarea Carbonica",
    category: "Minerals",
    usage: "मोटापा, हड्डी कमजोरी, बच्चों की बीमारियाँ",
    potency: "200C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 10,
    name: "Phosphorus",
    category: "Minerals",
    usage: "खांसी, रक्तस्राव, कमजोरी, फेफड़े",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 11,
    name: "Sepia",
    category: "Animal",
    usage: "महिला रोग, मासिक धर्म, थकान",
    potency: "200C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 12,
    name: "Natrum Muriaticum",
    category: "Minerals",
    usage: "सिरदर्द, एनीमिया, दुःख, त्वचा रोग",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 13,
    name: "Apis Mellifica",
    category: "Animal",
    usage: "सूजन, एलर्जी, मधुमक्खी का डंक",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 14,
    name: "Arsenicum Album",
    category: "Minerals",
    usage: "दस्त, उल्टी, बेचैनी, दमा",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 15,
    name: "Aconitum Napellus",
    category: "Plants",
    usage: "तेज बुखार, भय, सर्दी की शुरुआत",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 16,
    name: "Gelsemium Sempervirens",
    category: "Plants",
    usage: "कमजोरी, कंपन, फ्लू, भय",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 17,
    name: "Ignatia Amara",
    category: "Plants",
    usage: "दुःख, अवसाद, हिस्टीरिया, मनोवैज्ञानिक",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 18,
    name: "Lachesis Mutus",
    category: "Animal",
    usage: "गले का रोग, मेनोपॉज, जलन, बायीं ओर",
    potency: "200C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 19,
    name: "Mercurius Solubilis",
    category: "Minerals",
    usage: "गले में खराश, मुँह के छाले, पसीना",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 20,
    name: "Staphysagria",
    category: "Plants",
    usage: "दबी हुई भावनाएँ, मूत्र रोग, ऑपरेशन",
    potency: "200C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 21,
    name: "Silicea",
    category: "Minerals",
    usage: "मवाद, फोड़े, कमजोर हड्डी, पसीना",
    potency: "6C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 22,
    name: "Thuja Occidentalis",
    category: "Plants",
    usage: "मस्से, स्किन ग्रोथ, बाल झड़ना",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 23,
    name: "Hepar Sulphuris",
    category: "Minerals",
    usage: "फोड़े, गले की खराश, ठंड से बढ़े",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 24,
    name: "Graphites",
    category: "Minerals",
    usage: "त्वचा रोग, मोटापा, कब्ज, नाखून",
    potency: "6C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 25,
    name: "Causticum",
    category: "Minerals",
    usage: "पक्षाघात, मूत्र असंयम, मस्से, जलन",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 26,
    name: "Chamomilla",
    category: "Plants",
    usage: "दांत दर्द, बच्चों का रोना, दस्त",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 27,
    name: "Cantharis Vesicatoria",
    category: "Animal",
    usage: "मूत्र में जलन, सिस्टाइटिस, जले",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 28,
    name: "Colocynthis",
    category: "Plants",
    usage: "पेट में ऐंठन, दस्त, दर्द दबाने से",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 29,
    name: "Euphrasia Officinalis",
    category: "Plants",
    usage: "आँखों की जलन, आँसू, नेत्र रोग",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 30,
    name: "Ferrum Phosphoricum",
    category: "Minerals",
    usage: "बुखार की शुरुआत, एनीमिया, खून की कमी",
    potency: "6C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 31,
    name: "Hamamelis Virginiana",
    category: "Plants",
    usage: "बवासीर, वैरिकोज, रक्तस्राव",
    potency: "Q",
    unit: "ml",
    company: "SBL",
  },
  {
    id: 32,
    name: "Hypericum Perforatum",
    category: "Plants",
    usage: "नसों की चोट, दांत दर्द, रीढ़ की चोट",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 33,
    name: "Kali Bichromicum",
    category: "Minerals",
    usage: "साइनस, मोटा बलगम, जोड़ों का दर्द",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 34,
    name: "Ledum Palustre",
    category: "Plants",
    usage: "कीड़े का काटना, छिद्र घाव, गाउट",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 35,
    name: "Magnesia Phosphorica",
    category: "Minerals",
    usage: "मांसपेशियों में ऐंठन, शूल, नसों में दर्द",
    potency: "6C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 36,
    name: "Mezereum",
    category: "Plants",
    usage: "दाद, त्वचा पर फफोले, नसों का दर्द",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 37,
    name: "Natrum Sulphuricum",
    category: "Minerals",
    usage: "यकृत रोग, दमा, नमी से बढ़े",
    potency: "6C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 38,
    name: "Opium",
    category: "Plants",
    usage: "कब्ज, बेहोशी, श्वास रुकना",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 39,
    name: "Podophyllum Peltatum",
    category: "Plants",
    usage: "दस्त, यकृत रोग, बच्चों का दस्त",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 40,
    name: "Ruta Graveolens",
    category: "Plants",
    usage: "मोच, हड्डी में दर्द, टेंडन चोट",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 41,
    name: "Sanguinaria Canadensis",
    category: "Plants",
    usage: "माइग्रेन, दाईं ओर सिरदर्द, कंधे दर्द",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 42,
    name: "Spigelia Anthelmia",
    category: "Plants",
    usage: "हृदय दर्द, बाईं ओर, कृमि रोग",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 43,
    name: "Stannum Metallicum",
    category: "Minerals",
    usage: "खांसी, कमजोरी, सीने में भारीपन",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 44,
    name: "Stramonium",
    category: "Plants",
    usage: "भय, हिंसा, मिर्गी, बुखार में मतिभ्रम",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 45,
    name: "Urtica Urens",
    category: "Plants",
    usage: "पित्ती, जलन, बिछुआ एलर्जी",
    potency: "Q",
    unit: "ml",
    company: "SBL",
  },
  {
    id: 46,
    name: "Veratrum Album",
    category: "Plants",
    usage: "उल्टी-दस्त, कोलेरा, ठंडा पसीना",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 47,
    name: "Zincum Metallicum",
    category: "Minerals",
    usage: "बेचैन टांगें, थकान, मस्तिष्क कमजोरी",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 48,
    name: "Carcinosinum",
    category: "Nosodes",
    usage: "कैंसर प्रवृत्ति, थकान, पारिवारिक इतिहास",
    potency: "200C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 49,
    name: "Tuberculinum",
    category: "Nosodes",
    usage: "बार-बार सर्दी, बदलाव की इच्छा, क्षय",
    potency: "1M",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 50,
    name: "Medorrhinum",
    category: "Nosodes",
    usage: "यौन रोग, संधिवात, रात को बेहतर",
    potency: "1M",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 51,
    name: "Agaricus Muscarius",
    category: "Plants",
    usage: "तंत्रिका रोग, कंपन, शीतदंश",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 52,
    name: "Allium Cepa",
    category: "Plants",
    usage: "सर्दी, नाक बहना, आँखों से पानी",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 53,
    name: "Aloe Socotrina",
    category: "Plants",
    usage: "बवासीर, दस्त, पेट में भारीपन",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 54,
    name: "Alumina",
    category: "Minerals",
    usage: "कब्ज, त्वचा शुष्क, भ्रम",
    potency: "6C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 55,
    name: "Ambra Grisea",
    category: "Animal",
    usage: "शर्म, नपुंसकता, बुढ़ापे की कमजोरी",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 56,
    name: "Ammonium Muriaticum",
    category: "Minerals",
    usage: "खांसी, नाक बंद, मोटापा",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 57,
    name: "Anacardium Orientale",
    category: "Plants",
    usage: "याददाश्त कमजोर, आत्मविश्वास की कमी",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 58,
    name: "Antimonium Crudum",
    category: "Minerals",
    usage: "अपच, जीभ पर सफेद परत, नाखून रोग",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 59,
    name: "Antimonium Tartaricum",
    category: "Minerals",
    usage: "खांसी, फेफड़ों में बलगम, श्वास रोग",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 60,
    name: "Argentum Nitricum",
    category: "Minerals",
    usage: "चिंता, दस्त, पेट फूलना, भय",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 61,
    name: "Aurum Metallicum",
    category: "Minerals",
    usage: "अवसाद, हृदय रोग, हड्डी दर्द",
    potency: "200C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 62,
    name: "Baptisia Tinctoria",
    category: "Plants",
    usage: "टाइफाइड, बुखार, भ्रम, दुर्गंध",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 63,
    name: "Baryta Carbonica",
    category: "Minerals",
    usage: "बच्चों का विकास, बौद्धिक कमजोरी",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 64,
    name: "Berberis Vulgaris",
    category: "Plants",
    usage: "पथरी, पीठ दर्द, पित्ताशय, यूरिक एसिड",
    potency: "Q",
    unit: "ml",
    company: "SBL",
  },
  {
    id: 65,
    name: "Bismuthum Subnitricum",
    category: "Minerals",
    usage: "पेट दर्द, उल्टी, ग्रहणी रोग",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 66,
    name: "Borax Veneta",
    category: "Minerals",
    usage: "मुँह के छाले, शिशु रोग, भय",
    potency: "6C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 67,
    name: "Bufo Rana",
    category: "Animal",
    usage: "मिर्गी, यौन रोग, मानसिक विकार",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 68,
    name: "Calcarea Fluorica",
    category: "Minerals",
    usage: "हड्डी की गांठ, दाँत, वैरिकोज",
    potency: "6C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 69,
    name: "Calcarea Phosphorica",
    category: "Minerals",
    usage: "हड्डी टूटना, बच्चों का विकास, दाँत",
    potency: "6C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 70,
    name: "Calcarea Sulphurica",
    category: "Minerals",
    usage: "फोड़े, त्वचा रोग, मवाद",
    potency: "6C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 71,
    name: "Calendula Officinalis",
    category: "Plants",
    usage: "घाव भरना, कट, ऑपरेशन के बाद",
    potency: "Q",
    unit: "ml",
    company: "SBL",
  },
  {
    id: 72,
    name: "Camphora",
    category: "Plants",
    usage: "कोलेरा, कंपकंपी, ठंडापन",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 73,
    name: "Cannabis Indica",
    category: "Plants",
    usage: "मानसिक भ्रम, हँसी, याददाश्त",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 74,
    name: "Carbo Vegetabilis",
    category: "Plants",
    usage: "पेट फूलना, गैस, बेहोशी, कमजोरी",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 75,
    name: "Chelidonium Majus",
    category: "Plants",
    usage: "यकृत रोग, पीलिया, दाईं ओर दर्द",
    potency: "Q",
    unit: "ml",
    company: "Boiron",
  },
  {
    id: 76,
    name: "China Officinalis",
    category: "Plants",
    usage: "कमजोरी, मलेरिया, रक्त हानि, गैस",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 77,
    name: "Cimicifuga Racemosa",
    category: "Plants",
    usage: "महिला रोग, मासिक दर्द, गर्दन दर्द",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 78,
    name: "Cina Maritima",
    category: "Plants",
    usage: "पेट के कीड़े, बच्चों का रोना, दाँत",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 79,
    name: "Cinnabaris",
    category: "Minerals",
    usage: "साइनस, नाक की हड्डी, आँखें लाल",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 80,
    name: "Clematis Erecta",
    category: "Plants",
    usage: "मूत्र रोग, त्वचा फटना, अंडकोष",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 81,
    name: "Coffea Cruda",
    category: "Plants",
    usage: "अनिद्रा, दाँत दर्द, अति संवेदनशीलता",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 82,
    name: "Conium Maculatum",
    category: "Plants",
    usage: "कैंसर, ग्रंथि सूजन, चक्कर, बुढ़ापा",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 83,
    name: "Croton Tiglium",
    category: "Plants",
    usage: "दस्त, खुजली, त्वचा, एक्जिमा",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 84,
    name: "Cuprum Metallicum",
    category: "Minerals",
    usage: "ऐंठन, हैजा, खांसी, मांसपेशी में क्रैम्प",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 85,
    name: "Digitalis Purpurea",
    category: "Plants",
    usage: "हृदय रोग, धीमी नाड़ी, यकृत",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 86,
    name: "Dioscorea Villosa",
    category: "Plants",
    usage: "पेट में मरोड़, उदरशूल, पीठ दर्द",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 87,
    name: "Drosera Rotundifolia",
    category: "Plants",
    usage: "काली खांसी, क्रुप खांसी, रात की खांसी",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 88,
    name: "Dulcamara",
    category: "Plants",
    usage: "ठंड-नमी से रोग, सर्दी, मस्से",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 89,
    name: "Echinacea Angustifolia",
    category: "Plants",
    usage: "संक्रमण, रोग प्रतिरोधक, बुखार",
    potency: "Q",
    unit: "ml",
    company: "Schwabe",
  },
  {
    id: 90,
    name: "Equisetum Hyemale",
    category: "Plants",
    usage: "मूत्राशय दर्द, बार-बार पेशाब, बिस्तर",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 91,
    name: "Erigeron Canadensis",
    category: "Plants",
    usage: "रक्तस्राव, नाक से खून, मूत्र में खून",
    potency: "Q",
    unit: "ml",
    company: "SBL",
  },
  {
    id: 92,
    name: "Eryngium Aquaticum",
    category: "Plants",
    usage: "मूत्र रोग, गुर्दे का दर्द",
    potency: "Q",
    unit: "ml",
    company: "Boiron",
  },
  {
    id: 93,
    name: "Eupatorium Perfoliatum",
    category: "Plants",
    usage: "हड्डियों में दर्द, फ्लू, मलेरिया",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 94,
    name: "Fluoricum Acidum",
    category: "Minerals",
    usage: "वैरिकोज, फिस्टुला, नाखून, बाल झड़ना",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 95,
    name: "Glonoinum",
    category: "Minerals",
    usage: "सन स्ट्रोक, रक्तचाप, माइग्रेन",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 96,
    name: "Gratiola Officinalis",
    category: "Plants",
    usage: "दस्त, यकृत, कोलेस्ट्रॉल",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 97,
    name: "Guaiacum Officinale",
    category: "Plants",
    usage: "संधिवात, गठिया, गले की खराश",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 98,
    name: "Helleborus Niger",
    category: "Plants",
    usage: "मस्तिष्क रोग, मेनिनजाइटिस, उदासी",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 99,
    name: "Hydrastis Canadensis",
    category: "Plants",
    usage: "बलगम, साइनस, कमजोरी, पीलिया",
    potency: "Q",
    unit: "ml",
    company: "SBL",
  },
  {
    id: 100,
    name: "Hyoscyamus Niger",
    category: "Plants",
    usage: "मानसिक रोग, जलन, ईर्ष्या, मिर्गी",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 101,
    name: "Iodum",
    category: "Minerals",
    usage: "थायरॉइड, वजन घटना, भूख, ग्रंथि",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 102,
    name: "Ipecacuanha",
    category: "Plants",
    usage: "उल्टी, मतली, खांसी, रक्तस्राव",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 103,
    name: "Kali Carbonicum",
    category: "Minerals",
    usage: "कमर दर्द, फेफड़े, हृदय, कमजोरी",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 104,
    name: "Kali Muriaticum",
    category: "Minerals",
    usage: "सफेद बलगम, कान बंद, सूजन",
    potency: "6C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 105,
    name: "Kali Phosphoricum",
    category: "Minerals",
    usage: "तंत्रिका दुर्बलता, थकान, याददाश्त",
    potency: "6C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 106,
    name: "Kali Sulphuricum",
    category: "Minerals",
    usage: "पीले बलगम, त्वचा, खुजली",
    potency: "6C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 107,
    name: "Kreosotum",
    category: "Minerals",
    usage: "दाँत सड़न, योनि रोग, उल्टी",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 108,
    name: "Lac Caninum",
    category: "Sarcodes",
    usage: "गले का रोग, स्तन, आत्म-सम्मान",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 109,
    name: "Lac Humanum",
    category: "Sarcodes",
    usage: "पहचान, परिवार, आधुनिक तनाव",
    potency: "200C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 110,
    name: "Laurocerasus",
    category: "Plants",
    usage: "हृदय रोग, सायनोसिस, खांसी",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 111,
    name: "Lilium Tigrinum",
    category: "Plants",
    usage: "महिला रोग, उदासी, जल्दबाजी",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 112,
    name: "Lobelia Inflata",
    category: "Plants",
    usage: "दमा, तम्बाकू, मतली, श्वास",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 113,
    name: "Lyss",
    category: "Nosodes",
    usage: "जलसंत्रास, उत्तेजना, काटने से",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 114,
    name: "Magnesia Carbonica",
    category: "Minerals",
    usage: "अम्लता, दाँत दर्द, शूल",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 115,
    name: "Magnesia Muriatica",
    category: "Minerals",
    usage: "यकृत, कब्ज, मासिक",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 116,
    name: "Mancinella",
    category: "Plants",
    usage: "डर, मानसिक रोग, त्वचा",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 117,
    name: "Menyanthes Trifoliata",
    category: "Plants",
    usage: "सिरदर्द, खांसी, पेट ठंडा",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 118,
    name: "Millefolium",
    category: "Plants",
    usage: "रक्तस्राव, वैरिकोज, बुखार",
    potency: "Q",
    unit: "ml",
    company: "Schwabe",
  },
  {
    id: 119,
    name: "Moschus",
    category: "Animal",
    usage: "बेहोशी, हिस्टीरिया, कामोत्तेजना",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 120,
    name: "Murex Purpurea",
    category: "Animal",
    usage: "महिला रोग, गर्भाशय, कामेच्छा",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 121,
    name: "Natrum Carbonicum",
    category: "Minerals",
    usage: "सूर्य की गर्मी, अपच, टखने कमजोर",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 122,
    name: "Natrum Phosphoricum",
    category: "Minerals",
    usage: "अम्लता, कृमि, पीला स्राव",
    potency: "6C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 123,
    name: "Nitricum Acidum",
    category: "Minerals",
    usage: "मस्से, अल्सर, मलाशय में दर्द",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 124,
    name: "Nuphar Luteum",
    category: "Plants",
    usage: "यौन दुर्बलता, नपुंसकता",
    potency: "Q",
    unit: "ml",
    company: "Schwabe",
  },
  {
    id: 125,
    name: "Nux Moschata",
    category: "Plants",
    usage: "नींद, शुष्कता, पेट फूलना",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 126,
    name: "Oleander",
    category: "Plants",
    usage: "चर्म रोग, हृदय, तंत्रिका",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 127,
    name: "Oxalicum Acidum",
    category: "Minerals",
    usage: "नसों में दर्द, पथरी, ऑक्सालिक",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 128,
    name: "Palladium Metallicum",
    category: "Minerals",
    usage: "अंडाशय, प्रशंसा की इच्छा",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 129,
    name: "Petroleum",
    category: "Minerals",
    usage: "एक्जिमा, चक्कर, यात्रा-बीमारी",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 130,
    name: "Phytolacca Decandra",
    category: "Plants",
    usage: "गले की खराश, स्तन रोग, जोड़",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 131,
    name: "Picric Acid",
    category: "Minerals",
    usage: "मस्तिष्क थकान, पढ़ाई, कमजोरी",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 132,
    name: "Platina Metallicum",
    category: "Minerals",
    usage: "अहंकार, महिला रोग, अंडाशय",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 133,
    name: "Plumbum Metallicum",
    category: "Minerals",
    usage: "पक्षाघात, कब्ज, गुर्दे रोग",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 134,
    name: "Psorinum",
    category: "Nosodes",
    usage: "खुजली, त्वचा रोग, दुर्गंध",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 135,
    name: "Pyrogenium",
    category: "Nosodes",
    usage: "सेप्टिक बुखार, मवाद, शरीर दर्द",
    potency: "200C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 136,
    name: "Ranunculus Bulbosus",
    category: "Plants",
    usage: "दाद, पसलियों में दर्द, मौसम",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 137,
    name: "Rhododendron",
    category: "Plants",
    usage: "गठिया, तूफान से बढ़े, अंडकोष",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 138,
    name: "Robinia Pseudacacia",
    category: "Plants",
    usage: "अम्लता, अल्सर, हरी उल्टी",
    potency: "Q",
    unit: "ml",
    company: "SBL",
  },
  {
    id: 139,
    name: "Rumex Crispus",
    category: "Plants",
    usage: "खांसी, ठंड से बढ़े, गले में खुजली",
    potency: "30C",
    unit: "Globules",
    company: "Boiron",
  },
  {
    id: 140,
    name: "Sabadilla",
    category: "Plants",
    usage: "एलर्जी, छींक, कृमि, थायरॉइड",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 141,
    name: "Sabina",
    category: "Plants",
    usage: "गर्भस्राव, रक्तस्राव, गठिया",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 142,
    name: "Salix Nigra",
    category: "Plants",
    usage: "यौन उत्तेजना, प्रोस्टेट, गठिया",
    potency: "Q",
    unit: "ml",
    company: "Schwabe",
  },
  {
    id: 143,
    name: "Sambucus Nigra",
    category: "Plants",
    usage: "बच्चों की नाक बंद, दमा, भय",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 144,
    name: "Sarcolactic Acid",
    category: "Minerals",
    usage: "मांसपेशी थकान, लैक्टिक एसिड",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 145,
    name: "Sarsaparilla Officinalis",
    category: "Plants",
    usage: "पथरी, मूत्र रोग, एक्जिमा",
    potency: "Q",
    unit: "ml",
    company: "Boiron",
  },
  {
    id: 146,
    name: "Scutellaria Lateriflora",
    category: "Plants",
    usage: "तंत्रिका, अनिद्रा, मिर्गी",
    potency: "Q",
    unit: "ml",
    company: "SBL",
  },
  {
    id: 147,
    name: "Secale Cornutum",
    category: "Plants",
    usage: "रक्तस्राव, गर्भ, ठंड महसूस नहीं",
    potency: "30C",
    unit: "Globules",
    company: "SBL",
  },
  {
    id: 148,
    name: "Selenium Metallicum",
    category: "Minerals",
    usage: "यौन दुर्बलता, बाल झड़ना, यकृत",
    potency: "30C",
    unit: "Globules",
    company: "Schwabe",
  },
  {
    id: 149,
    name: "Senecio Aureus",
    category: "Plants",
    usage: "मासिक अनियमित, मूत्र रोग",
    potency: "Q",
    unit: "ml",
    company: "SBL",
  },
  {
    id: 150,
    name: "Senega Officinalis",
    category: "Plants",
    usage: "फेफड़ों में बलगम, नेत्र रोग",
    potency: "Q",
    unit: "ml",
    company: "SBL",
  },
];

const PAGE_SIZE = 25;
const CATEGORIES = ["Plants", "Minerals", "Nosodes", "Sarcodes", "Animal"];
const POTENCIES = ["6C", "30C", "200C", "1M", "10M", "Q"];

const CATEGORY_COLORS: Record<string, string> = {
  Plants: "bg-green-100 text-green-800",
  Minerals: "bg-blue-100 text-blue-800",
  Nosodes: "bg-purple-100 text-purple-800",
  Sarcodes: "bg-orange-100 text-orange-800",
  Animal: "bg-amber-100 text-amber-800",
};

export default function MedicineMaster() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPotency, setFilterPotency] = useState("all");
  const [page, setPage] = useState(1);
  const { medicines, addMedicines, initializeIfEmpty } =
    useMedicineMasterStore();
  useEffect(() => {
    initializeIfEmpty(HOMEO_MEDICINES);
  }, [initializeIfEmpty]);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<HomeoMedicine[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  const handleDownloadTemplate = () => {
    const headers = [
      "Name",
      "Category",
      "Usage (Hindi/English)",
      "Potency",
      "Unit",
      "Company",
    ];
    const sampleRows = [
      ["Arnica Montana", "Plants", "चोट, दर्द, सूजन", "30C", "Globules", "SBL"],
      [
        "Belladonna",
        "Plants",
        "तेज बुखार, सिरदर्द",
        "200C",
        "Globules",
        "Schwabe",
      ],
    ];
    const rows = [headers, ...sampleRows];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "medicine_master_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) {
          toast.error("No data found");
          setImportLoading(false);
          return;
        }
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let cur = "";
          let inQ = false;
          for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
              inQ = !inQ;
            } else if (c === "," && !inQ) {
              result.push(cur.trim());
              cur = "";
            } else {
              cur += c;
            }
          }
          result.push(cur.trim());
          return result;
        };
        const headers = parseCSVLine(lines[0]);
        const dataRows = lines.slice(1).map(parseCSVLine);
        const parsed: HomeoMedicine[] = dataRows
          .map((row, i) => {
            const r: Record<string, string> = {};
            headers.forEach((h, idx) => {
              r[h] = row[idx] ?? "";
            });
            return {
              id: Date.now() * 1000 + i,
              name: String(r.Name || r.name || "").trim(),
              category: String(r.Category || r.category || "Plants").trim(),
              usage: String(
                r["Usage (Hindi/English)"] || r.Usage || r.usage || "",
              ).trim(),
              potency: String(r.Potency || r.potency || "30C").trim(),
              unit: String(r.Unit || r.unit || "Globules").trim(),
              company: String(r.Company || r.company || "SBL").trim(),
            };
          })
          .filter((r) => r.name);
        setImportRows(parsed);
      } catch {
        toast.error("Failed to parse file. Please use the correct template.");
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleConfirmImport = () => {
    if (importRows.length === 0) return;
    const existingNames = new Set(medicines.map((m) => m.name.toLowerCase()));
    const newMeds = importRows.filter(
      (m) => !existingNames.has(m.name.toLowerCase()),
    );
    const duplicates = importRows.length - newMeds.length;
    addMedicines(newMeds);
    toast.success(
      `Imported ${newMeds.length} medicines${duplicates > 0 ? ` (${duplicates} duplicates skipped)` : ""}`,
    );
    setImportOpen(false);
    setImportRows([]);
    setImportFileName("");
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return medicines.filter((m) => {
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.usage.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q);
      const matchCategory =
        filterCategory === "all" || m.category === filterCategory;
      const matchPotency =
        filterPotency === "all" || m.potency === filterPotency;
      return matchSearch && matchCategory && matchPotency;
    });
  }, [search, filterCategory, filterPotency, medicines]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAddToInventory = (m: HomeoMedicine) => {
    toast.success(`${m.name} — navigate to Medicines to add to inventory`);
    navigate({ to: "/medicines" });
  };

  return (
    <>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "oklch(0.42 0.12 152)" }}
              >
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold">
                  Medicine मास्टर
                </h1>
                <p className="text-muted-foreground text-sm">
                  होम्योपैथी Reference Database
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className="text-sm px-3 py-1"
              style={{
                backgroundColor: "oklch(0.42 0.12 152)",
                color: "white",
              }}
              data-ocid="medicine-master.count.badge"
            >
              {medicines.length.toLocaleString("en-IN")} Medicines
            </Badge>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="gap-2"
              data-ocid="medicine-master.template.button"
            >
              <Download className="w-4 h-4" /> Template
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="gap-2"
              style={{
                borderColor: "oklch(0.42 0.12 152)",
                color: "oklch(0.42 0.12 152)",
              }}
              data-ocid="medicine-master.import.button"
            >
              <Upload className="w-4 h-4" /> Import Excel
            </Button>
            <Button
              onClick={() => navigate({ to: "/medicines" })}
              className="bg-primary text-primary-foreground gap-2"
              data-ocid="medicine-master.add_button"
            >
              <Plus className="w-4 h-4" /> Add Medicine
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="🔍 Search by name / usage / symptoms..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              data-ocid="medicine-master.search_input"
            />
          </div>
          <Select
            value={filterCategory}
            onValueChange={(v) => {
              setFilterCategory(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="w-44"
              data-ocid="medicine-master.category.select"
            >
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterPotency}
            onValueChange={(v) => {
              setFilterPotency(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="w-40"
              data-ocid="medicine-master.potency.select"
            >
              <SelectValue placeholder="All Potency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Potency</SelectItem>
              {POTENCIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results summary */}
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">{filtered.length}</span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {medicines.length.toLocaleString("en-IN")}
          </span>{" "}
          medicines
          {search || filterCategory !== "all" || filterPotency !== "all"
            ? " (filtered)"
            : ""}
        </p>

        {/* Table */}
        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b"
                    style={{ backgroundColor: "oklch(0.42 0.12 152 / 0.08)" }}
                  >
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-12">
                      S.No
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Medicine Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Usage / Key Symptoms
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Available Potency
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Unit / Form
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Company / Brand
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginated.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-16 text-muted-foreground"
                        data-ocid="medicine-master.empty_state"
                      >
                        No medicines found matching your search
                      </td>
                    </tr>
                  ) : (
                    paginated.map((m, i) => (
                      <tr
                        key={m.id}
                        className="hover:bg-muted/20 transition-colors"
                        data-ocid={`medicine-master.item.${i + 1}`}
                      >
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground">
                            {m.name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`text-xs ${CATEGORY_COLORS[m.category] ?? "bg-gray-100 text-gray-800"}`}
                          >
                            {m.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                          {m.usage}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: "oklch(0.42 0.12 152 / 0.1)",
                              color: "oklch(0.3 0.1 152)",
                            }}
                          >
                            {m.potency}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {m.unit}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {m.company}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1"
                            onClick={() => handleAddToInventory(m)}
                            data-ocid={`medicine-master.add_button.${i + 1}`}
                          >
                            <Plus className="w-3 h-3" /> Add to Inventory
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                data-ocid="medicine-master.pagination_prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg =
                  totalPages <= 7
                    ? i + 1
                    : page <= 4
                      ? i + 1
                      : page >= totalPages - 3
                        ? totalPages - 6 + i
                        : page - 3 + i;
                return (
                  <Button
                    key={pg}
                    variant={page === pg ? "default" : "outline"}
                    size="sm"
                    className={`w-8 h-8 p-0 ${
                      page === pg ? "bg-primary text-primary-foreground" : ""
                    }`}
                    onClick={() => setPage(pg)}
                    data-ocid={`medicine-master.item.${pg}`}
                  >
                    {pg}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                data-ocid="medicine-master.pagination_next"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <Dialog
          open={importOpen}
          onOpenChange={(o) => {
            setImportOpen(o);
            if (!o) {
              setImportRows([]);
              setImportFileName("");
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Medicines from Excel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800 border border-blue-200">
                <p className="font-semibold mb-1">How to import:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    Download the Excel template using the "Template" button
                  </li>
                  <li>
                    Fill in your medicines (Name, Category, Usage, Potency,
                    Unit, Company)
                  </li>
                  <li>Upload the filled file below</li>
                  <li>Review the preview and confirm import</li>
                </ol>
              </div>
              <div>
                <Label htmlFor="excel-upload" className="text-sm font-medium">
                  Select Excel / CSV File
                </Label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    id="excel-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button variant="outline" asChild>
                    <label
                      htmlFor="excel-upload"
                      className="cursor-pointer gap-2 flex items-center"
                    >
                      <Upload className="w-4 h-4" /> Choose File
                    </label>
                  </Button>
                  {importFileName && (
                    <span className="text-sm text-muted-foreground">
                      {importFileName}
                    </span>
                  )}
                </div>
              </div>
              {importLoading && (
                <p className="text-sm text-muted-foreground">Parsing file...</p>
              )}
              {importRows.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 text-green-700">
                    {importRows.length} medicines ready to import
                  </p>
                  <div className="border rounded overflow-auto max-h-64">
                    <table className="w-full text-xs">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2">#</th>
                          <th className="text-left px-3 py-2">Name</th>
                          <th className="text-left px-3 py-2">Category</th>
                          <th className="text-left px-3 py-2">Usage</th>
                          <th className="text-left px-3 py-2">Potency</th>
                          <th className="text-left px-3 py-2">Unit</th>
                          <th className="text-left px-3 py-2">Company</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {importRows.slice(0, 50).map((m, i) => (
                          <tr key={m.id} className="hover:bg-muted/30">
                            <td className="px-3 py-1.5 text-muted-foreground">
                              {i + 1}
                            </td>
                            <td className="px-3 py-1.5 font-medium">
                              {m.name}
                            </td>
                            <td className="px-3 py-1.5">{m.category}</td>
                            <td className="px-3 py-1.5 text-muted-foreground max-w-32 truncate">
                              {m.usage}
                            </td>
                            <td className="px-3 py-1.5">{m.potency}</td>
                            <td className="px-3 py-1.5">{m.unit}</td>
                            <td className="px-3 py-1.5">{m.company}</td>
                          </tr>
                        ))}
                        {importRows.length > 50 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-3 py-2 text-center text-muted-foreground text-xs"
                            >
                              ...and {importRows.length - 50} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setImportOpen(false);
                  setImportRows([]);
                  setImportFileName("");
                }}
                data-ocid="medicine-master.import.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={importRows.length === 0}
                style={{
                  backgroundColor: "oklch(0.42 0.12 152)",
                  color: "white",
                }}
                data-ocid="medicine-master.import.confirm_button"
              >
                Import{" "}
                {importRows.length > 0 ? `${importRows.length} Medicines` : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
