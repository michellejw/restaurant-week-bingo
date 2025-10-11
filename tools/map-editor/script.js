// Restaurant Map Editor - Main JavaScript
// Based on existing restaurant-config.js parsing logic

class RestaurantMapEditor {
    constructor() {
        this.map = null;
        this.restaurants = []; // Will hold either restaurants or sponsors
        this.markers = [];
        this.selectedRestaurant = null; // Will hold either restaurant or sponsor
        this.editingIndex = -1;
        this.isAddingMode = false;
        this.exportCounter = {}; // Track exports by date-time to handle duplicates
        this.dataType = null; // 'restaurants' or 'sponsors'
        
        this.init();
    }
    
    init() {
        this.initMap();
        this.bindEvents();
        this.setupFileUpload();
    }
    
    initMap() {
        // Initialize map centered on Carolina Beach, NC (matching your main app)
        this.map = L.map('map', {
            center: [34.035, -77.893],
            zoom: 13,
            zoomControl: true
        });
        
        // Add OpenStreetMap tiles (matching your main app)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Map click handler for adding restaurants
        this.map.on('click', (e) => {
            if (this.isAddingMode) {
                this.addRestaurantAtLocation(e.latlng);
            }
        });
    }
    
    bindEvents() {
        // File input
        document.getElementById('file-input').addEventListener('change', this.handleFileSelect.bind(this));
        
        // Buttons
        document.getElementById('add-restaurant-btn').addEventListener('click', this.toggleAddMode.bind(this));
        document.getElementById('add-mode-btn').addEventListener('click', this.toggleAddMode.bind(this));
        document.getElementById('export-btn').addEventListener('click', this.exportToExcel.bind(this));
        
        // Form events
        document.getElementById('restaurant-form').addEventListener('submit', this.saveRestaurant.bind(this));
        document.getElementById('delete-restaurant-btn').addEventListener('click', this.deleteRestaurant.bind(this));
        document.getElementById('cancel-edit-btn').addEventListener('click', this.cancelEdit.bind(this));
        
        // Drag and drop
        const fileUpload = document.querySelector('.file-upload');
        fileUpload.addEventListener('dragover', this.handleDragOver.bind(this));
        fileUpload.addEventListener('drop', this.handleDrop.bind(this));
        fileUpload.addEventListener('dragleave', this.handleDragLeave.bind(this));
    }
    
    setupFileUpload() {
        // Set up drag and drop visual feedback
        const fileUpload = document.querySelector('.file-upload');
        
        fileUpload.addEventListener('dragenter', (e) => {
            e.preventDefault();
            fileUpload.classList.add('drag-over');
        });
    }
    
    handleDragOver(e) {
        e.preventDefault();
    }
    
    handleDrop(e) {
        e.preventDefault();
        const fileUpload = e.target.closest('.file-upload');
        fileUpload.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    handleDragLeave(e) {
        const fileUpload = e.target.closest('.file-upload');
        fileUpload.classList.remove('drag-over');
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }
    
    async processFile(file) {
        try {
            this.showFileStatus('Processing file...', 'loading');
            
            const data = await this.readExcelFile(file);
            const { restaurants, errors } = this.parseRestaurantData(data);
            
            this.restaurants = restaurants;
            this.updateUI();
            this.renderMarkers();
            
            let statusMessage = `✅ Loaded ${restaurants.length} businesses`;
            
            // Update data type indicator
            const typeIndicator = document.getElementById('data-type-indicator');
            const dataTypeDisplay = this.dataType === 'sponsors' ? 'Sponsors' : 'Restaurants';
            typeIndicator.textContent = `[${dataTypeDisplay}]`;
            if (errors.length > 0) {
                statusMessage += ` (${errors.length} errors - check console)`;
                console.warn('Parsing errors:', errors);
            }
            
            this.showFileStatus(statusMessage, 'success');
            
            // Enable buttons
            document.getElementById('add-restaurant-btn').disabled = false;
            document.getElementById('add-mode-btn').disabled = false;
            document.getElementById('export-btn').disabled = false;
            
        } catch (error) {
            console.error('File processing error:', error);
            this.showFileStatus(`❌ Error: ${error.message}`, 'error');
        }
    }
    
    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Use sheet 2 (index 1) - sheet 1 is instructions (matching your existing logic)
                    const sheetName = workbook.SheetNames[1];
                    if (!sheetName) {
                        throw new Error('Could not find data sheet (sheet 2). Make sure your file has at least 2 sheets.');
                    }
                    
                    const worksheet = workbook.Sheets[sheetName];
                    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    if (rawData.length < 2) {
                        throw new Error('Spreadsheet appears to be empty or has no data rows');
                    }
                    
                    resolve(rawData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    detectDataType(rawData) {
        // Look for restaurant-specific patterns
        const hasRestaurantCode = rawData.some(row => 
            row && row.length > 3 && row[3] && 
            typeof row[3] === 'string' && 
            row[3].toString().trim().length > 0
        );
        
        // Look for sponsor-specific patterns in headers
        const headers = rawData[0] || [];
        const headerText = headers.join(' ').toLowerCase();
        const hasSponsorFields = headerText.includes('logo') || 
                                headerText.includes('promo') || 
                                headerText.includes('retail');
        
        // If it has codes in column D and no sponsor-specific fields, likely restaurants
        if (hasRestaurantCode && !hasSponsorFields) {
            return 'restaurants';
        }
        
        // If it has sponsor-specific fields, likely sponsors  
        if (hasSponsorFields) {
            return 'sponsors';
        }
        
        // Default to restaurants if unclear
        return 'restaurants';
    }
    
    parseRestaurantData(rawData) {
        // Detect data type first
        this.dataType = this.detectDataType(rawData);
        console.log(`Detected data type: ${this.dataType}`);
        
        if (this.dataType === 'sponsors') {
            return this.parseSponsorData(rawData);
        } else {
            return this.parseRestaurants(rawData);
        }
    }
    
    parseRestaurants(rawData) {
        // Adapted from your restaurant-config.js parseDataRows function
        const restaurants = [];
        const errors = [];
        
        // Find header row (matching your existing logic)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
            const row = rawData[i];
            if (row && row.some(cell => 
                typeof cell === 'string' && cell.toUpperCase() === 'NAME'
            )) {
                headerRowIndex = i;
                break;
            }
        }
        
        if (headerRowIndex === -1) {
            throw new Error('Could not find header row with NAME column');
        }
        
        // Parse restaurant data using hardcoded column positions (matching your existing logic)
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || !row[0]) continue;
            
            const rowNum = i + 1;
            
            try {
                const restaurant = {
                    name: row[0]?.toString()?.trim(),
                    address: row[1]?.toString()?.trim(),
                    url: row[2]?.toString()?.trim() || null,
                    code: row[3]?.toString()?.trim(),
                    latitude: parseFloat(row[4]),
                    longitude: parseFloat(row[5]),
                    description: row[6]?.toString()?.trim() || null,
                    phone: row[8]?.toString()?.trim() || null,
                    specials: row[13]?.toString()?.trim() || null,
                    _rowNumber: rowNum
                };
                
                // Validate required fields (matching your existing logic)
                if (!restaurant.name || !restaurant.code || 
                    isNaN(restaurant.latitude) || isNaN(restaurant.longitude)) {
                    errors.push(`Row ${rowNum}: missing required data (name, code, or coordinates)`);
                    continue;
                }
                
                restaurants.push(restaurant);
                
            } catch (error) {
                errors.push(`Row ${rowNum}: ${error.message}`);
            }
        }
        
        return { restaurants, errors };
    }
    
    parseSponsorData(rawData) {
        // Adapted from your sponsor-config.js parseDataRows function
        const restaurants = []; // Keep using 'restaurants' array for consistency
        const errors = [];
        
        // Headers are in row 0, data starts in row 1
        const headers = rawData[0];
        const dataRows = rawData.slice(1);
        
        // Map column names to indexes (flexible matching like the working sponsor script)
        const columnMap = {};
        headers.forEach((header, index) => {
            const h = header.toString().toLowerCase().trim();
            if (h === 'name*' || h === 'name') {
                columnMap.name = index;
            } else if (h.includes('logo filename') || h.includes('logo') || h.includes('filename')) {
                columnMap.logo_file = index;
            } else if (h.includes('address')) {
                columnMap.address = index;
            } else if (h.includes('lat')) {
                columnMap.latitude = index;
            } else if (h.includes('long') || h.includes('lng')) {
                columnMap.longitude = index;
            } else if (h.includes('phone')) {
                columnMap.phone = index;
            } else if (h.includes('url') || h.includes('website')) {
                columnMap.url = index;
            } else if (h.includes('desc')) {
                columnMap.description = index;
            } else if (h.includes('promo') || h.includes('offer')) {
                columnMap.promo_offer = index;
            } else if (h.includes('retail')) {
                columnMap.is_retail = index;
            }
        });
        
        // Validate required columns
        const required = ['name', 'address'];
        const missing = required.filter(col => columnMap[col] === undefined);
        if (missing.length > 0) {
            throw new Error(`Missing required columns: ${missing.join(', ')}`);
        }
        
        // Parse data rows
        dataRows.forEach((row, index) => {
            const rowNum = index + 2; // Account for header + 0-based indexing
            
            // Skip empty rows
            if (!row[columnMap.name] || row[columnMap.name].toString().trim() === '') {
                return;
            }
            
            try {
                const sponsor = {
                    name: row[columnMap.name]?.toString().trim(),
                    address: row[columnMap.address]?.toString().trim(),
                    latitude: columnMap.latitude !== undefined ? parseFloat(row[columnMap.latitude]) || 0 : 0,
                    longitude: columnMap.longitude !== undefined ? parseFloat(row[columnMap.longitude]) || 0 : 0,
                    phone: row[columnMap.phone]?.toString().trim() || null,
                    url: row[columnMap.url]?.toString().trim() || null,
                    description: row[columnMap.description]?.toString().trim() || null,
                    promo_offer: row[columnMap.promo_offer]?.toString().trim() || null,
                    is_retail: row[columnMap.is_retail]?.toString().toLowerCase().includes('true') || false,
                    logo_file: row[columnMap.logo_file]?.toString().trim() || null,
                    _rowNumber: rowNum
                };
                
                // Validate required fields
                if (!sponsor.name || !sponsor.address) {
                    errors.push(`Row ${rowNum}: Missing name or address`);
                    return;
                }
                
                // Clean up URL
                if (sponsor.url && !sponsor.url.startsWith('http')) {
                    sponsor.url = 'https://' + sponsor.url;
                }
                
                restaurants.push(sponsor);
                
            } catch (error) {
                errors.push(`Row ${rowNum}: ${error.message}`);
            }
        });
        
        return { restaurants, errors };
    }
    
    renderMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
        
        if (this.restaurants.length === 0) return;
        
        // Create markers for each restaurant
        this.restaurants.forEach((restaurant, index) => {
            const marker = L.marker([restaurant.latitude, restaurant.longitude], {
                draggable: true
            });
            
            // Popup content
            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 8px 0; color: #1e293b;">${restaurant.name}</h4>
                    <p style="margin: 0 0 4px 0; font-size: 0.875rem; color: #64748b;">${restaurant.address}</p>
                    <p style="margin: 0 0 8px 0; font-size: 0.875rem; color: #64748b;">Code: ${restaurant.code}</p>
                    <button onclick="window.restaurantEditor.editRestaurant(${index})" 
                            style="background: #ff6b35; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                        ✏️ Edit
                    </button>
                </div>
            `);
            
            // Store original position for drag comparison
            marker._originalLat = restaurant.latitude;
            marker._originalLng = restaurant.longitude;
            marker._restaurantIndex = index;
            
            // Drag start handler
            marker.on('dragstart', (e) => {
                marker.closePopup();
            });
            
            // Drag end handler with confirmation
            marker.on('dragend', (e) => {
                const newPos = e.target.getLatLng();
                const originalLat = marker._originalLat;
                const originalLng = marker._originalLng;
                
                // Check if position actually changed significantly
                const latDiff = Math.abs(newPos.lat - originalLat);
                const lngDiff = Math.abs(newPos.lng - originalLng);
                
                if (latDiff > 0.0001 || lngDiff > 0.0001) {
                    this.confirmLocationChange(index, originalLat, originalLng, newPos.lat, newPos.lng);
                }
            });
            
            // Click handler
            marker.on('click', () => {
                this.selectRestaurant(index);
            });
            
            marker.addTo(this.map);
            this.markers.push(marker);
        });
        
        // Fit map to show all markers
        if (this.restaurants.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }
    
    confirmLocationChange(index, oldLat, oldLng, newLat, newLng) {
        const restaurant = this.restaurants[index];
        const message = `Update location for "${restaurant.name}"?\n\nOld: ${oldLat.toFixed(6)}, ${oldLng.toFixed(6)}\nNew: ${newLat.toFixed(6)}, ${newLng.toFixed(6)}`;
        
        if (confirm(message)) {
            // Accept the change
            this.updateRestaurantLocation(index, newLat, newLng);
            this.showEditMessage(`✅ Updated location for "${restaurant.name}"`, 'success');
        } else {
            // Revert the marker position
            this.markers[index].setLatLng([oldLat, oldLng]);
        }
    }
    
    updateRestaurantLocation(index, lat, lng) {
        if (index >= 0 && index < this.restaurants.length) {
            this.restaurants[index].latitude = lat;
            this.restaurants[index].longitude = lng;
            
            // Update the marker's stored original position
            this.markers[index]._originalLat = lat;
            this.markers[index]._originalLng = lng;
            
            // Update form if this restaurant is being edited
            if (this.editingIndex === index) {
                document.getElementById('edit-latitude').value = lat.toFixed(6);
                document.getElementById('edit-longitude').value = lng.toFixed(6);
            }
            
            // Update the restaurant list display
            this.updateUI();
            
            console.log(`Updated ${this.restaurants[index].name} location to ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
    }
    
    selectRestaurant(index) {
        // Clear previous selection
        document.querySelectorAll('.restaurant-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Select new restaurant
        this.selectedRestaurant = this.restaurants[index];
        const listItem = document.querySelector(`[data-index="${index}"]`);
        if (listItem) {
            listItem.classList.add('selected');
            listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // Highlight marker
        this.markers.forEach((marker, i) => {
            if (i === index) {
                marker.openPopup();
            } else {
                marker.closePopup();
            }
        });
    }
    
    updateFormFields() {
        const isSponsors = this.dataType === 'sponsors';
        
        // Restaurant-only fields
        document.getElementById('specials-group').style.display = isSponsors ? 'none' : 'block';
        
        // Code field - required for restaurants, optional for sponsors
        const codeInput = document.getElementById('edit-code');
        const codeLabel = document.getElementById('code-label');
        if (isSponsors) {
            codeInput.removeAttribute('required');
            codeLabel.textContent = 'Code (optional)';
            document.getElementById('code-group').style.display = 'none'; // Hide completely for sponsors
        } else {
            codeInput.setAttribute('required', 'required');
            codeLabel.textContent = 'Business Code *';
            document.getElementById('code-group').style.display = 'block';
        }
        
        // Sponsor-only fields
        document.getElementById('promo-group').style.display = isSponsors ? 'block' : 'none';
        document.getElementById('retail-group').style.display = isSponsors ? 'block' : 'none';
        document.getElementById('logo-group').style.display = isSponsors ? 'block' : 'none';
    }
    
    editRestaurant(index) {
        this.editingIndex = index;
        const restaurant = this.restaurants[index];
        
        console.log('Editing restaurant:', restaurant); // Debug log
        
        // Close any open popups
        this.markers.forEach(marker => marker.closePopup());
        
        // Show/hide fields based on data type
        this.updateFormFields();
        
        // Populate form with current data
        document.getElementById('edit-name').value = restaurant.name || '';
        document.getElementById('edit-address').value = restaurant.address || '';
        document.getElementById('edit-latitude').value = restaurant.latitude || '';
        document.getElementById('edit-longitude').value = restaurant.longitude || '';
        document.getElementById('edit-code').value = restaurant.code || '';
        document.getElementById('edit-url').value = restaurant.url || '';
        document.getElementById('edit-phone').value = restaurant.phone || '';
        document.getElementById('edit-description').value = restaurant.description || '';
        
        // Restaurant-specific fields
        document.getElementById('edit-specials').value = restaurant.specials || '';
        
        // Sponsor-specific fields
        if (this.dataType === 'sponsors') {
            document.getElementById('edit-promo').value = restaurant.promo_offer || '';
            document.getElementById('edit-retail').checked = restaurant.is_retail || false;
            document.getElementById('edit-logo').value = restaurant.logo_file || '';
        }
        
        // Show form and scroll it into view
        const editForm = document.getElementById('editing-form');
        editForm.classList.add('active');
        editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Select and highlight the restaurant
        this.selectRestaurant(index);
        
        // Clear any previous messages
        document.getElementById('edit-messages').innerHTML = '';
        
        // Focus on the name field for immediate editing
        setTimeout(() => {
            document.getElementById('edit-name').focus();
        }, 100);
        
        // Add real-time coordinate validation and preview
        const latInput = document.getElementById('edit-latitude');
        const lngInput = document.getElementById('edit-longitude');
        
        const updatePreview = () => {
            const lat = parseFloat(latInput.value);
            const lng = parseFloat(lngInput.value);
            
            if (!isNaN(lat) && !isNaN(lng) && this.markers[index]) {
                // Update marker position for preview
                this.markers[index].setLatLng([lat, lng]);
            }
        };
        
        latInput.addEventListener('input', updatePreview);
        lngInput.addEventListener('input', updatePreview);
    }
    
    saveRestaurant(e) {
        e.preventDefault();
        
        try {
            const formData = {
                name: document.getElementById('edit-name').value.trim(),
                address: document.getElementById('edit-address').value.trim(),
                latitude: parseFloat(document.getElementById('edit-latitude').value),
                longitude: parseFloat(document.getElementById('edit-longitude').value),
                url: document.getElementById('edit-url').value.trim() || null,
                phone: document.getElementById('edit-phone').value.trim() || null,
                description: document.getElementById('edit-description').value.trim() || null
            };
            
            // Add type-specific fields
            if (this.dataType === 'sponsors') {
                formData.promo_offer = document.getElementById('edit-promo').value.trim() || null;
                formData.is_retail = document.getElementById('edit-retail').checked;
                formData.logo_file = document.getElementById('edit-logo').value.trim() || null;
            } else {
                formData.code = document.getElementById('edit-code').value.trim();
                formData.specials = document.getElementById('edit-specials').value.trim() || null;
            }
            
            // Validate required fields based on data type
            let validationErrors = [];
            if (!formData.name) validationErrors.push('Name is required');
            if (!formData.address) validationErrors.push('Address is required');
            if (isNaN(formData.latitude)) validationErrors.push('Valid latitude is required');
            if (isNaN(formData.longitude)) validationErrors.push('Valid longitude is required');
            if (this.dataType === 'restaurants' && !formData.code) validationErrors.push('Business code is required');
            
            if (validationErrors.length > 0) {
                this.showEditMessage('Validation errors:\n• ' + validationErrors.join('\n• '), 'error');
                return;
            }
            
            if (this.editingIndex === -1) {
                // Adding new restaurant
                formData._rowNumber = this.restaurants.length + 1;
                this.restaurants.push(formData);
                this.showEditMessage('✅ Business added successfully!', 'success');
                this.showFileStatus(`✅ Added new business: "${formData.name}"`, 'success');
            } else {
                // Updating existing restaurant
                const existing = this.restaurants[this.editingIndex];
                const oldName = existing.name;
                Object.assign(existing, formData);
                this.showEditMessage('✅ Business updated successfully!', 'success');
                this.showFileStatus(`✅ Updated business: "${formData.name}"`, 'success');
                
                // Update marker position if coordinates changed
                if (this.markers[this.editingIndex]) {
                    this.markers[this.editingIndex].setLatLng([formData.latitude, formData.longitude]);
                    this.markers[this.editingIndex]._originalLat = formData.latitude;
                    this.markers[this.editingIndex]._originalLng = formData.longitude;
                }
            }
            
            this.updateUI();
            this.renderMarkers();
            
            // Hide form after a delay
            setTimeout(() => {
                this.cancelEdit();
            }, 2000);
            
        } catch (error) {
            this.showEditMessage(`Error saving restaurant: ${error.message}`, 'error');
        }
    }
    
    deleteRestaurant() {
        if (this.editingIndex === -1) return;
        
        const restaurant = this.restaurants[this.editingIndex];
        const confirmMessage = `⚠️ DELETE BUSINESS ⚠️\n\n"${restaurant.name}"\n${restaurant.address}\n\nThis action cannot be undone.\n\nAre you sure you want to delete this business?`;
        
        if (confirm(confirmMessage)) {
            const deletedName = restaurant.name;
            this.restaurants.splice(this.editingIndex, 1);
            this.updateUI();
            this.renderMarkers();
            this.cancelEdit();
            
            // Show success message in file status area so it's visible
            this.showFileStatus(`✅ Deleted business: "${deletedName}"`, 'success');
            
            console.log(`Deleted restaurant: ${deletedName}`);
        }
    }
    
    cancelEdit() {
        this.editingIndex = -1;
        this.selectedRestaurant = null;
        document.getElementById('editing-form').classList.remove('active');
        document.getElementById('restaurant-form').reset();
        
        // Clear selection
        document.querySelectorAll('.restaurant-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Close all popups
        this.markers.forEach(marker => marker.closePopup());
    }
    
    toggleAddMode() {
        this.isAddingMode = !this.isAddingMode;
        const btn = document.getElementById('add-mode-btn');
        const sidebarBtn = document.getElementById('add-restaurant-btn');
        
        if (this.isAddingMode) {
            btn.classList.add('active');
            sidebarBtn.textContent = '✖️ Cancel Add';
            this.map.getContainer().style.cursor = 'crosshair';
        } else {
            btn.classList.remove('active');
            sidebarBtn.textContent = '➕ Add Business';
            this.map.getContainer().style.cursor = '';
        }
    }
    
    addRestaurantAtLocation(latlng) {
        // Create new business with default values
        const businessType = this.dataType === 'sponsors' ? 'Sponsor' : 'Restaurant';
        const newRestaurant = {
            name: `New ${businessType}`,
            address: 'Enter address here',
            latitude: latlng.lat,
            longitude: latlng.lng,
            code: this.dataType === 'restaurants' ? `REST${Date.now()}` : null,
            url: null,
            phone: null,
            description: null,
            specials: this.dataType === 'restaurants' ? null : undefined,
            promo_offer: this.dataType === 'sponsors' ? null : undefined,
            is_retail: this.dataType === 'sponsors' ? false : undefined,
            logo_file: this.dataType === 'sponsors' ? null : undefined,
            _rowNumber: this.restaurants.length + 1
        };
        
        this.restaurants.push(newRestaurant);
        this.renderMarkers();
        this.updateUI();
        
        // Start editing the new restaurant
        this.editRestaurant(this.restaurants.length - 1);
        
        // Exit add mode
        this.toggleAddMode();
    }
    
    updateUI() {
        // Update restaurant count
        document.getElementById('restaurant-count').textContent = this.restaurants.length;
        
        // Update restaurant list
        const listContainer = document.getElementById('restaurant-list');
        if (this.restaurants.length === 0) {
            listContainer.innerHTML = '<div class="loading">No businesses loaded</div>';
            return;
        }
        
        listContainer.innerHTML = this.restaurants.map((restaurant, index) => `
            <div class="restaurant-item" data-index="${index}" onclick="window.restaurantEditor.selectRestaurant(${index})">
                <h4>${restaurant.name}</h4>
                <p>📍 ${restaurant.address}</p>
                <p>🔗 Code: ${restaurant.code}</p>
                <p>📍 ${restaurant.latitude.toFixed(4)}, ${restaurant.longitude.toFixed(4)}</p>
                <div style="margin-top: 0.5rem;">
                    <button class="btn btn-small" onclick="event.stopPropagation(); window.restaurantEditor.editRestaurant(${index}); console.log('Edit button clicked for index:', ${index});">
                        ✏️ Edit
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add click event listeners to edit buttons (backup method)
        document.querySelectorAll('.restaurant-item .btn').forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Edit button event listener triggered for index:', index);
                this.editRestaurant(index);
            });
        });
    }
    
    generateExportFileName() {
        const now = new Date();
        
        // Format date as YYYY-MM-DD
        const date = now.toISOString().split('T')[0];
        
        // Format time as HH-MM (24-hour format, use dash instead of colon for filename compatibility)
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const time = `${hours}-${minutes}`;
        
        // Create base filename key for tracking duplicates
        const baseKey = `${date}-${time}`;
        const dataPrefix = this.dataType === 'sponsors' ? 'sponsor-data' : 'restaurant-data';
        const baseName = `${dataPrefix}-edited-${baseKey}`;
        
        // Check if we've already exported with this date-time combo
        if (this.exportCounter[baseKey]) {
            // Increment the counter for this date-time
            this.exportCounter[baseKey]++;
            return `${baseName}-(${this.exportCounter[baseKey]}).xlsx`;
        } else {
            // First export with this date-time
            this.exportCounter[baseKey] = 1;
            return `${baseName}.xlsx`;
        }
    }
    
    exportToExcel() {
        try {
            let data, wb;
            if (this.dataType === 'sponsors') {
                // Sponsor export format (single sheet with flexible headers)
                const headers = [
                    'Name*', 'Address', 'Latitude', 'Longitude', 'Phone', 'Website', 
                    'Description', 'Promo Offer', 'Is Retail', 'Logo Filename'
                ];
                
                data = [
                    headers,
                    ...this.restaurants.map(sponsor => [
                        sponsor.name,
                        sponsor.address,
                        sponsor.latitude || 0,
                        sponsor.longitude || 0,
                        sponsor.phone || '',
                        sponsor.url || '',
                        sponsor.description || '',
                        sponsor.promo_offer || '',
                        sponsor.is_retail ? 'TRUE' : 'FALSE',
                        sponsor.logo_file || ''
                    ])
                ];
                
                // Create workbook with single sheet for sponsors
                wb = XLSX.utils.book_new();
                const sponsorWs = XLSX.utils.aoa_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, sponsorWs, 'Sponsor Data');
                
            } else {
                // Restaurant export format (2 sheets with fixed structure)
                const headers = [
                    'NAME', 'ADDRESS', 'URL', 'CODE', 'LATITUDE', 'LONGITUDE', 
                    'DESCRIPTION', '', 'PHONE', '', '', '', '', 'SPECIALS'
                ];
                
                data = [
                    headers,
                    ...this.restaurants.map(restaurant => [
                        restaurant.name,
                        restaurant.address,
                        restaurant.url || '',
                        restaurant.code || '',
                        restaurant.latitude,
                        restaurant.longitude,
                        restaurant.description || '',
                        '', // Column 7 (empty)
                        restaurant.phone || '',
                        '', '', '', '', // Columns 9-12 (empty)
                        restaurant.specials || ''
                    ])
                ];
                
                // Create workbook with 2 sheets for restaurants
                wb = XLSX.utils.book_new();
                
                // Sheet 1: Instructions
                const instructionsData = [
                    ['Restaurant Week Data Import Instructions'],
                    [''],
                    ['Sheet 2 contains the actual restaurant data.'],
                    ['Please do not modify the column headers.'],
                    ['Required fields: NAME, ADDRESS, CODE, LATITUDE, LONGITUDE']
                ];
                const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
                XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');
                
                // Sheet 2: Restaurant data
                const restaurantWs = XLSX.utils.aoa_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, restaurantWs, 'Restaurant Data');
            }
            
            // Generate filename with date, time, and duplicate handling
            const fileName = this.generateExportFileName();
            console.log(`Generating export file: ${fileName}`);
            XLSX.writeFile(wb, fileName);
            
            this.showEditMessage(`✅ Exported ${this.restaurants.length} businesses to ${fileName}`, 'success');
            this.showFileStatus(`📁 Downloaded: ${fileName}`, 'success');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showEditMessage(`❌ Export failed: ${error.message}`, 'error');
        }
    }
    
    showFileStatus(message, type) {
        const statusEl = document.getElementById('file-status');
        statusEl.innerHTML = message;
        statusEl.className = `status-bar ${type}`;
        statusEl.style.display = 'block';
        
        // Auto-clear success and error messages after a delay
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
        }
    }
    
    showEditMessage(message, type) {
        const messagesEl = document.getElementById('edit-messages');
        messagesEl.innerHTML = `<div class="${type}">${message}</div>`;
        
        // Auto-clear success messages
        if (type === 'success') {
            setTimeout(() => {
                messagesEl.innerHTML = '';
            }, 3000);
        }
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.restaurantEditor = new RestaurantMapEditor();
});