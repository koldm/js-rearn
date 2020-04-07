var Calc = (function () {
	
	var Calc = function (props) {
		this.options = props.options;
		this.iconShow = '<svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.108 1.814L1.568 7.354L0.861004 6.646L7.108 0.400004L13.354 6.646L12.646 7.354L7.108 1.814Z" fill="black"/></svg>';
		this.iconHide = '<svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.892 6.186L12.432 0.645996L13.139 1.354L6.892 7.6L0.645996 1.354L1.354 0.645996L6.892 6.186Z" fill="black"/></svg>';
		this.carCost = new Slider('#car-cost', {});
		this.anInitialFee = new Slider('#an-initial-fee', {});
		this.leaseTerm = new Slider('#lease-term', {});
	};
	
	// смена иконки напротив модели авто для выпадающего списка
	Calc.prototype.checkIcon = function (type) {
		
		var el = document.getElementById('calc-item__icon');
		
		if (el !== null) {
			if (type == 'hide')
				document.getElementById('calc-item__icon').innerHTML = this.iconHide;
			
			if (type == 'show')
				document.getElementById('calc-item__icon').innerHTML = this.iconShow;
		}
		
        $('#select-car .selectize-dropdown .selectize-dropdown-content .option').removeClass('selected');
	};
	
	// субсидия
	Calc.prototype.getSubsidy = function (price, percentSubsidy = 0) {
		
		var subsidy = price / 100 * percentSubsidy;
		
		if (subsidy > 625000) subsidy = 625000;
		
		return subsidy;
	}
	
	// получаем данные по авто
	Calc.prototype.getActiveCar = function () {
		var getId = document.getElementsByClassName('calc-item')[0].dataset.value.replace(/[^+\d]/g, '');
		return this.options.filter(el => el.id == getId)[0];
	}
	
	// калькулятор
	Calc.prototype.calculate = function () {
		
		var price = this.carCost.getValue(); //цена ПЛ
		var month = this.leaseTerm.getValue(); // срок лизинга
		var subsidy = this.getSubsidy(price, this.getActiveCar().subsidy); //субсидия
		var firstPay = this.anInitialFee.getValue() + subsidy; //первоначальный взнос = взнос из калькулятора + субсидия
		var percentFirstPay = firstPay / price; // первоначальный взнос в процентах от цены ПЛ
		var nds = 1.2;
		
		var percentFinishPay = 1200 / price / 100; //выкупной платеж по умолчанию
		if (this.options.finishPay) //выкупной платеж кастомный
			percentFinishPay = this.options.finishPay;
			
		var annualRate = 0.172; //годовая ставка по умолчанию
		if (this.options.annualRate) //годовая ставка кастомная
			annualRate = this.options.annualRate;
		
		// ежемесячный платеж
		var monthPay = (price * (1 - percentFirstPay - percentFinishPay) + 11900 + 700 * (month / 12) + (0.0236 * price)) * (annualRate * (nds / 12) + (annualRate * (nds / 12)) / (Math.pow((1 + (annualRate * (nds / 12))), month) - 1)) + (price * percentFinishPay * (annualRate / 12) * nds);
		monthPay = Math.round(monthPay);
		
		var leaseAmount = Math.round(firstPay + monthPay * month); //сумма договора лизинга
		var taxSavings = Math.round(leaseAmount * 0.4); //экономия по налогам 
		var acquisitionCosts = Math.round(firstPay + monthPay * month + price * percentFinishPay - taxSavings); //затраты на приобретение
		
		document.getElementById('month-pay').innerText = monthPay.toLocaleString('ru') + ' ₽';
		document.getElementById('lease-amount').innerText = leaseAmount.toLocaleString('ru') + ' ₽';
		document.getElementById('tax-savings').innerText = taxSavings.toLocaleString('ru') + ' ₽';
		document.getElementById('acquisition-costs').innerText = acquisitionCosts.toLocaleString('ru') + ' ₽';
		
	};
	
	//оформление текста в input`е
	Calc.prototype.markup = function (id) {
		var item = document.getElementById(id);
		var text = item.dataset.text;
		var price = +item.value;
		
		if (id == 'car-cost') item.value = this.carCost.getValue().toLocaleString('ru') + ' ' + text;
		if (id == 'an-initial-fee') item.value = this.anInitialFee.getValue().toLocaleString('ru') + ' ' + text;
		
	};
	
	//округление
	Calc.prototype.decimalAdjust = function (type, value, exp) {
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math[type](value);
        }
        value = +value;
        exp = +exp;
		
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
		
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
		
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
	};
	
	Calc.prototype.round10 = function (value, exp) {
		return this.decimalAdjust('round', value, exp);
	};
	
	Calc.prototype.floor10 = function (value, exp) {
		return this.decimalAdjust('floor', value, exp);
	};
	
	Calc.prototype.ceil10 = function (value, exp) {
		return this.decimalAdjust('ceil', value, exp);
	};
	
	// градация под input`ом
	Calc.prototype.graduation = function (number) {
		var result = '';

		switch (number.toString().length) {
			case 1:
			case 2:
			case 3:
				result = number + 'руб';
				break;
			case 4:
			case 5:
			case 6:
				result = this.round10(number / 1000).toString().replace('.', ',') + ' тыс';
				break;
			default:
				result = this.round10(number / 1000000, -1).toString().replace('.', ',') + ' млн';

		}

		return result;
	};
	
	//месяем значение в Первоначальном взносе
	Calc.prototype.setInitialFee = function (setNewVal) {
		var price = this.carCost.getValue(); //цена ПЛ
		var subsidy = this.getSubsidy(price, this.getActiveCar().subsidy); //субсидия
		var presentMin = document.getElementById('an-initial-fee-min').value; //минимальный первоначальный взнос
		var initialFee = this.anInitialFee.getValue();
		
		var min = Math.round(price / 100 * presentMin);
		var max = Math.round(0.49 * price - subsidy);
		var middle = Math.round((min + max) / 2);
		
		this.anInitialFee.setAttribute('min', min);
		this.anInitialFee.setAttribute('max', max);
		
		if (setNewVal) this.anInitialFee.setValue(min);
		if (initialFee < min) this.anInitialFee.setValue(min);
		if (initialFee > max) this.anInitialFee.setValue(max);
		
		document.getElementById('an-initial-fee-text-min').innerText = this.graduation(min);
		document.getElementById('an-initial-fee-text-middle').innerText = this.graduation(middle);
		document.getElementById('an-initial-fee-text-max').innerText = this.graduation(max);
	}
	
	//изменяем оформление выпадающего списка
	Calc.prototype.customSelect = function () {
		
		//изменяем стандартное оформление select
		//данная библиотека зависима от jquery
		$('#select-car select').selectize({
			options: this.options,
			render: { //добавляем верстку в кастомный option
				option: (data) => { // для выпадающего списка
					var present = data.present ? '<span class="item__present">' + data.present + '</span>' : '';
					return '<div class="option">' + data.name + present + '</div>';
					
				},
				item: (data) => { // для выбранного элемента
				
					var present = data.present ? '<span class="calc-item__present">' + data.present + '</span>' : '';
					return '<div class="calc-item">' + data.name + present  + '<span id="calc-item__icon">' + this.iconHide + '</span>' + '</div>';
					
				}
			},
			onFocus: () => this.checkIcon('show'), // смена иконки при развернутом списке списке
			onBlur: () => {
				this.checkIcon('hide'); // смена иконки при свернутом списке списке
				this.carCost.setValue(this.getActiveCar().price);
				this.setInitialFee(true);
			}
		});
		
	};
	
	//добытия для input
	Calc.prototype.events = function () {
		var inputs = document.querySelectorAll('input[class="calculator__input"');
		inputs.forEach((input) => {
			
			input.addEventListener('focus', (e) => {
				var val = +e.target.value.replace(/\D+/g, '');
				e.target.value = val;
			});
			
			input.addEventListener('blur', (e) => {
				var val = +e.target.value.replace(/\D+/g, '');
				
				if (input.id == 'car-cost') {
					this.carCost.setValue(val);
					this.anInitialFee.setValue(this.anInitialFee.getValue());
				}
				
				if (input.id == 'an-initial-fee') this.anInitialFee.setValue(val);
				if (input.id == 'lease-term') this.leaseTerm.setValue(val);
				
			});
		});
	};
	
	//оформление для кнопок ежемесячного платежа и изменение срока лизинга
	Calc.prototype.checkMonth = function (type) {
		var val = this.leaseTerm.getValue();
		
		if (type == 'minus') val = val + 6;
		if (type == 'plus') val = val - 6;
		
		this.leaseTerm.setValue(val);
		
		var min = this.leaseTerm.getAttribute('min');
		var max = this.leaseTerm.getAttribute('max');
		
		if (val <= min) {
			document.getElementById('month-pay-plus').classList.add('month-pay__disable');
		} else {
			document.getElementById('month-pay-plus').classList.remove('month-pay__disable');
		}
		
		if (val >= max) {
			document.getElementById('month-pay-minus').classList.add('month-pay__disable');
		} else {
			document.getElementById('month-pay-minus').classList.remove('month-pay__disable');
		}
		
	};
	
	Calc.prototype.init = function () {
		this.customSelect(); // изменяем select
		
		this.carCost.on('change', (v) => { // при изменении цены
			this.calculate(); // калькулятор
			this.markup('car-cost'); // в стоимости авто меняем оформление текста
			this.anInitialFee.setValue(this.anInitialFee.getValue()); // устанавливаем новое значение в первоначальном взносе
			this.setInitialFee(false); // меняем подписи под input в первоначальном взносе
		});
		
		this.anInitialFee.on('change', (v) => { // при изменении первоначального взноса
			this.calculate(); // калькулятор
			this.markup('an-initial-fee');// в первоначальном взносе меняем оформление текста
		});
		
		this.leaseTerm.on('change', (v) => { // при изменении срока лизинга
			this.calculate(); // калькулятор
		});
		
		this.events(); // регистрируем события для input
		
		this.markup('car-cost'); // в стоимости авто меняем оформление текста
		this.markup('an-initial-fee'); // в первоначальном взносе меняем оформление текста
		
		this.setInitialFee(true); // меняем подписи под input в первоначальном взносе
		this.calculate(); // калькулятор
		
		document.getElementById('month-pay-minus').onclick = () => {
			this.checkMonth('minus'); // кнопка в ежемесячном платеже
		};
		
		document.getElementById('month-pay-plus').onclick = () => {
			this.checkMonth('plus'); // кнопка в ежемесячном платеже
		};
	}
	
	return Calc;
})();

//test commit