import { Component, OnInit } from '@angular/core';
import { MealService } from '../../services/meals.service';
import { Food, Meal } from '../../interfaces/food.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-meals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meals.component.html',
  styleUrls: ['./meals.component.css'] // Corregido de 'styleUrl' a 'styleUrls'
})
export class MealsComponent implements OnInit {
  meals: Meal[] = [];
  totalCalories: number = 0; // Nueva variable para almacenar las calorías totales

  constructor(private mealService: MealService) {}

  ngOnInit(): void {
    this.mealService.meals$.subscribe((meals) => {
      this.meals = meals;
      this.totalCalories = this.mealService.getTotalCalories(); // Actualiza el total de calorías
    });
  }

  getCalories(food: Food): string {
    const calories = food.foodNutrients?.find(n => n.nutrientName === 'Energy');
    return calories ? calories.value.toString() : 'Nutrient data not available';
  }

   // Método para eliminar un alimento de una comida específica
   deleteFoodFromMeal(meal: Meal, food: Food): void {
    this.mealService.deleteFoodFromMeal(meal, food);
    this.totalCalories = this.mealService.getTotalCalories(); // Actualiza el total de calorías después de eliminar
  }
}
