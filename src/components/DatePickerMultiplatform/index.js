import React, { useState, useRef, useEffect } from 'react';
import { View, Platform, TouchableOpacity, Text, Modal, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './styles';

export default function DatePickerMultiplatform({
  value,
  onChange,
  label = '',
  placeholder = 'Selecione uma data'
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());
  const [inputText, setInputText] = useState('');
  const calendarInputRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  
  // Atualiza o texto do input quando o valor muda externamente
  useEffect(() => {
    if (value) {
      setInputText(formatDate(value, false));
    } else {
      setInputText('');
    }
  }, [value]);
  
  // Efeito para abrir o calendário nativo quando showPicker muda para true
  useEffect(() => {
    if (Platform.OS === 'web' && showPicker && calendarInputRef.current) {
      // Pequeno timeout para garantir que o DOM esteja pronto
      setTimeout(() => {
        calendarInputRef.current.click();
        calendarInputRef.current.showPicker();
      }, 50);
    }
  }, [showPicker]);

  // Formatar data para exibição
  const formatDate = (date, forDisplay = true) => {
    if (!date) return placeholder;
    
    if (forDisplay) {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } else {
      // Formato para o input: DD/MM/YYYY
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };
  
  // Formatar data para o input HTML
  const formatDateForHtmlInput = (date) => {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Função para lidar com a mudança de data
  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS !== 'web') {
        onChange(selectedDate);
      }
    }
  };

  // Confirmar seleção (para iOS)
  const confirmSelection = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  // Cancelar seleção (para iOS)
  const cancelSelection = () => {
    setTempDate(value || new Date());
    setShowPicker(false);
  };
  
  // Processar entrada manual de data
  const processDateInput = (text) => {
    setInputText(text);
    
    // Aplicar máscara de data (DD/MM/YYYY)
    let formattedText = text.replace(/\D/g, '');
    if (formattedText.length > 0) {
      formattedText = formattedText.replace(/^(\d{0,2})(\d{0,2})(\d{0,4}).*/, (_, p1, p2, p3) => {
        let result = '';
        if (p1) result += p1;
        if (p2) result += '/' + p2;
        if (p3) result += '/' + p3;
        return result;
      });
      
      // Se o texto formatado for diferente, atualize o input
      if (formattedText !== text) {
        setInputText(formattedText);
      }
    }
    
    // Verificar se o texto tem o formato DD/MM/YYYY
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = formattedText.match(dateRegex);
    
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // Mês é baseado em zero
      const year = parseInt(match[3], 10);
      
      // Verificar se os valores são válidos
      if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        const newDate = new Date(year, month, day, 12, 0, 0);
        
        // Verificar se a data é válida (ex: 31/02/2023 não é válido)
        if (!isNaN(newDate.getTime()) && newDate.getDate() === day) {
          setTempDate(newDate);
          onChange(newDate);
        }
      }
    }
  };
  
  // Função para lidar com a seleção de data no calendário HTML
  const handleCalendarChange = (e) => {
    if (e.target.value) {
      const [year, month, day] = e.target.value.split('-').map(Number);
      const newDate = new Date(year, month - 1, day, 12, 0, 0);
      
      if (!isNaN(newDate.getTime())) {
        setTempDate(newDate);
        onChange(newDate);
        setInputText(formatDate(newDate, false));
        setShowPicker(false); // Fecha o calendário automaticamente após a seleção
      }
    }
  };
  
  // Função para abrir o calendário
  const openCalendar = () => {
    setShowPicker(true);
  };

  // Renderização para web
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container} ref={containerRef}>
        {label && <Text style={styles.label}>{label}</Text>}
        
        <View style={styles.webInputContainer}>
          {/* Input para digitação manual */}
          <TextInput
            ref={inputRef}
            style={styles.webTextInput}
            value={inputText}
            onChangeText={processDateInput}
            placeholder="DD/MM/AAAA"
          />
          
          {/* Ícone de calendário */}
          <TouchableOpacity 
            style={styles.calendarIcon}
            onPress={openCalendar}
          >
            <MaterialIcons name="calendar-today" size={20} color="#333" />
          </TouchableOpacity>
          
          {/* Input de data oculto que será acionado pelo ícone */}
          <input
            ref={calendarInputRef}
            type="date"
            style={{
              position: 'absolute',
              opacity: 0,
              width: 0,
              height: 0,
              pointerEvents: showPicker ? 'auto' : 'none'
            }}
            value={formatDateForHtmlInput(tempDate)}
            onChange={handleCalendarChange}
            onBlur={() => setShowPicker(false)}
          />
        </View>
      </View>
    );
  }

  // Renderização para iOS
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.buttonText}>{formatDate(value)}</Text>
          <MaterialIcons name="calendar-today" size={20} color="#333" />
        </TouchableOpacity>
        {showPicker && (
          <Modal
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={cancelSelection}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmSelection}>
                    <Text style={styles.confirmText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleChange}
                  style={styles.iosPicker}
                />
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  // Renderização para Android
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.buttonText}>{formatDate(value)}</Text>
        <MaterialIcons name="calendar-today" size={20} color="#333" />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}
