import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Meal, Food, UserMeals } from '../interfaces/food.interface';
import { FoodService } from './food.service';

@Injectable({
  providedIn: 'root',
})
export class MealService {
  private apiUrl = 'http://localhost:3000/userMeals'; // Cambia la URL para apuntar al endpoint de UserMeals
  private mealsSubject = new BehaviorSubject<Meal[]>([]);
  meals$ = this.mealsSubject.asObservable();
  private userId: string | null = null;

  
  foodServ=inject(FoodService);

  constructor(private http: HttpClient) {
    this.userId = localStorage.getItem('userToken');
    this.loadMeals(); // Cargar comidas al iniciar el servicio
  }

  // Método para cargar las comidas desde JSON Server
  private loadMeals(): void {
    this.http.get<UserMeals[]>(this.apiUrl)
      .pipe(
        map((userMeals) => {
          const userMealsData = userMeals.find(um => um.userId === this.userId);
          const meals = userMealsData ? userMealsData.meals : [];
  
          const requiredMeals = ['BreakFast', 'Lunch', 'Snack', 'Dinner', 'Dessert'];
          requiredMeals.forEach((mealName) => {
            if (!meals.some(meal => meal.name === mealName)) {
              meals.push({
                name: mealName,
                foods: [],
                totalCalories: 0,
                totalProteins: 0,
                totalCarbs: 0,
                totalFats: 0,
              });
            }
          });
          return meals;
        }),
        catchError(error => {
          console.error('Error fetching meals:', error);
          return of([]); // Retorna un array vacío en caso de error
        })
      )
      .subscribe((meals) => this.mealsSubject.next(meals));
  }
  
  // Método para agregar un alimento a una comida
  addFoodToMeal(food: Food, mealName: string, amountInGrams: number) {
    if (!this.userId) return;

    const newFood: Food = {
        description: food.description,
        foodNutrients: food.foodNutrients.filter(n => 
            n.nutrientName === 'Energy' ||
            n.nutrientName === 'Protein' ||
            n.nutrientName === 'Carbohydrate, by difference' ||
            n.nutrientName === 'Total lipid (fat)'
        ), 
        selectedMeal: food.selectedMeal,
        amountInGrams: food.amountInGrams,
        id: this.userId
    };

    const currentMeals = this.mealsSubject.getValue();
    const meal = currentMeals.find(m => m.name === mealName);

    if (meal) {
        // Agregar alimento a la comida existente
        meal.foods.push(newFood); // Cambiar food por newFood aquí
        const nutrients = this.calculateNutrients(food, amountInGrams);
        meal.totalCalories += nutrients.calories;
        meal.totalProteins = (meal.totalProteins || 0) + nutrients.proteins;
        meal.totalCarbs = (meal.totalCarbs || 0) + nutrients.carbs;
        meal.totalFats = (meal.totalFats || 0) + nutrients.fats;

        this.foodServ.saveFood(newFood).subscribe(
            {
                next: () => {
                    alert(`Comida guardada `);
                },
                error: () => {
                    console.error(`Error`);
                }
            }
        )
        this.updateUserMeals(currentMeals);
    } /*else {
        // Crear nueva comida si no existe
        const newMeal: Meal = {
            name: mealName,
            foods: [newFood], // Cambiar food por newFood aquí
            totalCalories: 0,
            totalProteins: 0,
            totalCarbs: 0,
            totalFats: 0,
        };

        // Calcular nutrientes del nuevo alimento y agregar
        const nutrients = this.calculateNutrients(food, amountInGrams);
        newMeal.totalCalories += nutrients.calories;
        newMeal.totalProteins += nutrients.proteins;
        newMeal.totalCarbs += nutrients.carbs;
        newMeal.totalFats += nutrients.fats;

        // Guardar la nueva comida en JSON Server
        this.foodServ.saveFood(newFood).subscribe(
            {
                next: () => {
                    alert(`Comida guardada en el else`);
                },
                error: () => {
                    console.error(`Error`);
                }
            }
        )
        currentMeals.push(newMeal);
        this.updateUserMeals(currentMeals);
    }*/
}


  getTotalCalories(): number {
    const currentMeals = this.mealsSubject.getValue();
    return currentMeals.reduce((total, meal) => total + meal.totalCalories, 0);
  }

  private calculateNutrients(food: Food, amountInGrams: number) {
    const calories = (food.foodNutrients.find(n => n.nutrientName === 'Energy')?.value || 0) * (amountInGrams / 100);
    const proteins = (food.foodNutrients.find(n => n.nutrientName === 'Protein')?.value || 0) * (amountInGrams / 100);
    const carbs = (food.foodNutrients.find(n => n.nutrientName === 'Carbohydrate, by difference')?.value || 0) * (amountInGrams / 100);
    const fats = (food.foodNutrients.find(n => n.nutrientName === 'Total lipid (fat)')?.value || 0) * (amountInGrams / 100);

    return { calories, proteins, carbs, fats };
  }

  private updateUserMeals(meals: Meal[]) {
    const userMeals: UserMeals = {
      userId: this.userId as string,
      meals: meals,
    };
    

    // Actualizar las comidas del usuario en JSON Server
   this.http.put(`${this.apiUrl}/${this.userId}`, userMeals).subscribe();
  }

  deleteFoodFromMeal(meal: Meal, food: Food): void {
    const currentMeals = this.mealsSubject.getValue();
    const targetMeal = currentMeals.find(m => m.name === meal.name);

    if (targetMeal) {
        targetMeal.foods = targetMeal.foods.filter(f => f.id !== food.id);
        this.updateMealTotals(targetMeal);
        this.updateUserMeals(currentMeals);

        // Verifica que food.id no sea undefined
        if (food.id) {
            // Llama a FoodService para eliminar el alimento del servidor
            this.foodServ.deleteFoodFromMeal(this.userId as string, meal.name, food.id).subscribe({
                next: () => {
                    console.log('Food deleted successfully from server.');
                },
                error: (err) => {
                    console.error('Error deleting food from server:', err);
                }
            });
        } else {
            console.error('Food ID is undefined, cannot delete food.');
        }
    }
}



  private updateMealTotals(meal: Meal): void {
    meal.totalCalories = meal.foods.reduce((sum, food) => {
        const calories = food.foodNutrients.find(n => n.nutrientName === 'Energy')?.value || 0;
        return sum + calories;
    }, 0);

    meal.totalProteins = meal.foods.reduce((sum, food) => {
        const proteins = food.foodNutrients.find(n => n.nutrientName === 'Protein')?.value || 0;
        return sum + proteins;
    }, 0);

    meal.totalCarbs = meal.foods.reduce((sum, food) => {
        const carbs = food.foodNutrients.find(n => n.nutrientName === 'Carbohydrate, by difference')?.value || 0;
        return sum + carbs;
    }, 0);

    meal.totalFats = meal.foods.reduce((sum, food) => {
        const fats = food.foodNutrients.find(n => n.nutrientName === 'Total lipid (fat)')?.value || 0;
        return sum + fats;
    }, 0);
}

}
