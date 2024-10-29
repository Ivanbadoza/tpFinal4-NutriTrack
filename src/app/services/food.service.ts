import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Food, Nutrient, UserMeals } from '../interfaces/food.interface';
import { Observable } from 'rxjs';
import { UserServiceService } from './user.service';
import { switchMap,map } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class FoodService {

  UserServ=inject(UserServiceService);
  apiKey = 'WXR98JlYSznuZKeTrZ475zL2bGhiZHlSaL390rxV';
  url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${this.apiKey}`;
  urlUserMeals=`http://localhost:3000/userMeals/`;
  
  constructor(private http: HttpClient) {}

  getFood(foodItem: string): Observable<Food[]> {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${foodItem}&api_key=${this.apiKey}`;
    return this.http.get<{ foods: any[] }>(url).pipe(
      map(response => response.foods.map(food => this.mapToFood(food)))
    );
  }
// Mapea la respuesta de la API a la interfaz Food
private mapToFood(foodData: any): Food {
  return {
      description: foodData.description,
      foodNutrients: foodData.foodNutrients.map((n: Nutrient) => ({
          nutrientName: n.nutrientName,
          value: n.value,
          unitName: n.unitName,
      })).filter((n:Nutrient) => 
          n.nutrientName === 'Energy' ||
          n.nutrientName === 'Protein' ||
          n.nutrientName === 'Carbohydrate, by difference' ||
          n.nutrientName === 'Total lipid (fat)'
      ),
      selectedMeal: foodData.selectedMeal,
      amountInGrams: foodData.amountInGrams,
      id: foodData.id,
  };
}



  saveFood(food: Food): Observable<Food> {
    return this.http.post<Food>(this.urlUserMeals,food);
  }
 

  deleteFoodFromMeal(userId: string, mealName: string, foodId: string): Observable<UserMeals> {
    const url = `${this.urlUserMeals}/${userId}`;
    
    return this.http.get<UserMeals>(url).pipe(
        switchMap(userMeals => {
            const meal = userMeals.meals.find(m => m.name === mealName);
            if (meal) {
                meal.foods = meal.foods.filter(food => food.id !== foodId);
            }

            return this.http.put<UserMeals>(url, userMeals);
        })
    );
}

  
}
